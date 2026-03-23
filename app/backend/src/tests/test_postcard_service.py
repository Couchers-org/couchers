from unittest.mock import MagicMock, patch

import pytest
from requests import RequestException

from couchers.postal.my_postcard import (
    _authenticate,
    _place_order,
    send_postcard,
)
from couchers.resources import get_postcard_front_image


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


class TestGetPostcardFrontImage:
    def test_returns_png_bytes(self):
        data = get_postcard_front_image()
        assert isinstance(data, bytes)
        assert len(data) > 0
        # PNG magic bytes
        assert data[:4] == b"\x89PNG"


class TestAuthenticate:
    @patch("couchers.postal.my_postcard.requests.post")
    def test_returns_auth_token(self, mock_post):
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"auth_token": "test-token-123"},
        )
        token = _authenticate()
        assert token == "test-token-123"
        mock_post.assert_called_once()

    @patch("couchers.postal.my_postcard.requests.post")
    def test_raises_on_missing_token(self, mock_post):
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"error": "invalid credentials"},
        )
        with pytest.raises(KeyError):
            _authenticate()

    @patch("couchers.postal.my_postcard.requests.post")
    def test_raises_on_http_error(self, mock_post):
        mock_post.return_value = MagicMock()
        mock_post.return_value.raise_for_status.side_effect = RequestException("500 Server Error")
        with pytest.raises(RequestException):
            _authenticate()


class TestPlaceOrder:
    @patch("couchers.postal.my_postcard.requests.post")
    def test_places_order_successfully(self, mock_post):
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"job_id": "12345", "status": "ok"},
        )
        recipient = {
            "recipientName": "Test User",
            "addressLine1": "123 Main St",
            "city": "Berlin",
            "countryiso": "DE",
            "zip": "10717",
        }
        result = _place_order("auth-token", recipient, b"fake-front-image", b"fake-back-image")
        assert result["job_id"] == "12345"

        call_kwargs = mock_post.call_args
        assert call_kwargs.kwargs["data"]["auth_token"] == "auth-token"
        assert call_kwargs.kwargs["files"]["photo"][0] == "postcard.png"
        assert call_kwargs.kwargs["files"]["logo_addon"][0] == "logo.png"

    @patch("couchers.postal.my_postcard.requests.post")
    def test_raises_on_http_error(self, mock_post):
        mock_post.return_value = MagicMock()
        mock_post.return_value.raise_for_status.side_effect = RequestException("Bad Request")
        with pytest.raises(RequestException):
            _place_order("auth-token", {}, b"fake-front-image", b"fake-back-image")


class TestSendPostcard:
    @patch("couchers.postal.my_postcard._place_order")
    @patch("couchers.postal.my_postcard._authenticate")
    @patch("couchers.postal.my_postcard.get_postcard_front_image")
    def test_success(self, mock_image, mock_auth, mock_order):
        mock_image.return_value = b"fake-image"
        mock_auth.return_value = "auth-token"
        mock_order.return_value = {"job_id": "123"}

        send_postcard(
            recipient_name="Test User",
            address_line_1="123 Main St",
            address_line_2="Apt 4",
            city="Berlin",
            state=None,
            postal_code="10717",
            country="DE",
            verification_code="ABC123",
            qr_code_url="https://example.com/verify?code=ABC123",
        )

        # Verify recipient was built correctly
        recipient_arg = mock_order.call_args[0][1]
        assert recipient_arg["recipientName"] == "Test User"
        assert recipient_arg["addressLine1"] == "123 Main St"
        assert recipient_arg["addressLine2"] == "Apt 4"
        assert recipient_arg["zip"] == "10717"
        assert recipient_arg["countryiso"] == "DE"
        assert "state" not in recipient_arg  # None values are excluded

    @patch("couchers.postal.my_postcard._place_order")
    @patch("couchers.postal.my_postcard._authenticate")
    @patch("couchers.postal.my_postcard.get_postcard_front_image")
    def test_optional_fields_excluded_when_none(self, mock_image, mock_auth, mock_order):
        mock_image.return_value = b"fake-image"
        mock_auth.return_value = "auth-token"
        mock_order.return_value = {"job_id": "123"}

        send_postcard(
            recipient_name="Test User",
            address_line_1="123 Main St",
            address_line_2=None,
            city="Berlin",
            state=None,
            postal_code=None,
            country="DE",
            verification_code="ABC123",
            qr_code_url="https://example.com/verify?code=ABC123",
        )

        recipient_arg = mock_order.call_args[0][1]
        assert "addressLine2" not in recipient_arg
        assert "zip" not in recipient_arg
        assert "state" not in recipient_arg

    @patch("couchers.postal.my_postcard._authenticate")
    @patch("couchers.postal.my_postcard.get_postcard_front_image")
    def test_auth_failure_raises(self, mock_image, mock_auth):
        mock_image.return_value = b"fake-image"
        mock_auth.side_effect = RequestException("Connection refused")

        with pytest.raises(RequestException, match="Connection refused"):
            send_postcard(
                recipient_name="Test User",
                address_line_1="123 Main St",
                address_line_2=None,
                city="Berlin",
                state=None,
                postal_code=None,
                country="DE",
                verification_code="ABC123",
                qr_code_url="https://example.com/verify?code=ABC123",
            )

    @patch("couchers.postal.my_postcard._authenticate")
    @patch("couchers.postal.my_postcard.get_postcard_front_image")
    def test_auth_service_error_raises(self, mock_image, mock_auth):
        mock_image.return_value = b"fake-image"
        mock_auth.side_effect = Exception("auth failed: invalid credentials")

        with pytest.raises(Exception, match="auth failed"):
            send_postcard(
                recipient_name="Test User",
                address_line_1="123 Main St",
                address_line_2=None,
                city="Berlin",
                state=None,
                postal_code=None,
                country="DE",
                verification_code="ABC123",
                qr_code_url="https://example.com/verify?code=ABC123",
            )

    @patch("couchers.postal.my_postcard._place_order")
    @patch("couchers.postal.my_postcard._authenticate")
    @patch("couchers.postal.my_postcard.get_postcard_front_image")
    def test_order_failure_raises(self, mock_image, mock_auth, mock_order):
        mock_image.return_value = b"fake-image"
        mock_auth.return_value = "auth-token"
        mock_order.side_effect = RequestException("500 Server Error")

        with pytest.raises(RequestException, match="500 Server Error"):
            send_postcard(
                recipient_name="Test User",
                address_line_1="123 Main St",
                address_line_2=None,
                city="Berlin",
                state=None,
                postal_code=None,
                country="DE",
                verification_code="ABC123",
                qr_code_url="https://example.com/verify?code=ABC123",
            )
