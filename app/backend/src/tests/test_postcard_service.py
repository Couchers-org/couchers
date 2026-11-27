from unittest.mock import MagicMock, patch

import pytest
from requests import RequestException

from couchers.postal.my_postcard import AddressRejectedError, authenticate, send_postcard
from couchers.resources import get_postcard_front_image


def test_get_postcard_front_image_returns_png():
    data = get_postcard_front_image()
    assert isinstance(data, bytes)
    assert len(data) > 0
    assert data[:4] == b"\x89PNG"


def test_send_postcard_success():
    with (
        patch("couchers.postal.my_postcard._place_order") as mock_order,
        patch("couchers.postal.my_postcard.get_postcard_front_image") as mock_image,
    ):
        mock_image.return_value = b"fake-image"
        mock_order.return_value = {"job_id": 12345}

        job_id = send_postcard(
            auth_token="auth-token",
            recipient_name="Test User",
            address_line_1="123 Main St",
            address_line_2="Apt 4",
            city="Berlin",
            state=None,
            postal_code="10717",
            country="DE",
            verification_code="ABC123",
        )

        assert job_id == 12345
        assert mock_order.call_args[0][0] == "auth-token"


def test_send_postcard_builds_recipient_correctly():
    with (
        patch("couchers.postal.my_postcard._place_order") as mock_order,
        patch("couchers.postal.my_postcard.get_postcard_front_image") as mock_image,
    ):
        mock_image.return_value = b"fake-image"
        mock_order.return_value = {"job_id": 123}

        send_postcard(
            auth_token="auth-token",
            recipient_name="Test User",
            address_line_1="123 Main St",
            address_line_2="Apt 4",
            city="Berlin",
            state=None,
            postal_code="10717",
            country="DE",
            verification_code="ABC123",
        )

        recipient_arg = mock_order.call_args[0][1]
        assert recipient_arg["recipientName"] == "Test User"
        assert recipient_arg["addressLine1"] == "123 Main St"
        assert recipient_arg["addressLine2"] == "Apt 4"
        assert recipient_arg["zip"] == "10717"
        assert recipient_arg["countryiso"] == "DE"
        assert "state" not in recipient_arg


def test_send_postcard_excludes_none_optional_fields():
    with (
        patch("couchers.postal.my_postcard._place_order") as mock_order,
        patch("couchers.postal.my_postcard.get_postcard_front_image") as mock_image,
    ):
        mock_image.return_value = b"fake-image"
        mock_order.return_value = {"job_id": 123}

        send_postcard(
            auth_token="auth-token",
            recipient_name="Test User",
            address_line_1="123 Main St",
            address_line_2=None,
            city="Berlin",
            state=None,
            postal_code=None,
            country="DE",
            verification_code="ABC123",
        )

        recipient_arg = mock_order.call_args[0][1]
        assert "addressLine2" not in recipient_arg
        assert "zip" not in recipient_arg
        assert "state" not in recipient_arg


def test_authenticate_failure():
    with patch("couchers.postal.my_postcard.requests.post") as mock_post:
        mock_post.side_effect = RequestException("Connection refused")

        with pytest.raises(RequestException, match="Connection refused"):
            authenticate()


def test_send_postcard_order_failure():
    with (
        patch("couchers.postal.my_postcard._place_order") as mock_order,
        patch("couchers.postal.my_postcard.get_postcard_front_image") as mock_image,
    ):
        mock_image.return_value = b"fake-image"
        mock_order.side_effect = RequestException("500 Server Error")

        with pytest.raises(RequestException, match="500 Server Error"):
            send_postcard(
                auth_token="auth-token",
                recipient_name="Test User",
                address_line_1="123 Main St",
                address_line_2=None,
                city="Berlin",
                state=None,
                postal_code=None,
                country="DE",
                verification_code="ABC123",
            )


def _send_test_postcard() -> int:
    return send_postcard(
        auth_token="auth-token",
        recipient_name="Test User",
        address_line_1="123 Main St",
        address_line_2=None,
        city="Berlin",
        state=None,
        postal_code=None,
        country="DE",
        verification_code="ABC123",
    )


def test_send_postcard_address_rejected():
    response = MagicMock(status_code=400, text='{"error":"adress data incomplete or badly formatted."}')
    with patch("couchers.postal.my_postcard.requests.post", return_value=response):
        with pytest.raises(AddressRejectedError):
            _send_test_postcard()


def test_send_postcard_other_400_is_not_address_rejected():
    response = MagicMock(status_code=400, text='{"error":"image_type not supported."}')
    response.raise_for_status.side_effect = RequestException("400 Client Error")
    with patch("couchers.postal.my_postcard.requests.post", return_value=response):
        with pytest.raises(RequestException):
            _send_test_postcard()
