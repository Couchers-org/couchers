from unittest.mock import patch

import pytest
from requests import RequestException

from couchers.context import make_logged_out_context
from couchers.i18n import LocalizationContext
from couchers.postal.my_postcard import send_postcard
from couchers.resources import get_postcard_front_image


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


_context = make_logged_out_context(LocalizationContext.en_utc())


def test_get_postcard_front_image_returns_png():
    data = get_postcard_front_image()
    assert isinstance(data, bytes)
    assert len(data) > 0
    assert data[:4] == b"\x89PNG"


def test_send_postcard_success():
    with (
        patch("couchers.postal.my_postcard._place_order") as mock_order,
        patch("couchers.postal.my_postcard._authenticate") as mock_auth,
        patch("couchers.postal.my_postcard.get_postcard_front_image") as mock_image,
    ):
        mock_image.return_value = b"fake-image"
        mock_auth.return_value = "auth-token"
        mock_order.return_value = {"job_id": 12345}

        job_id = send_postcard(
            _context,
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
        mock_auth.assert_called_once()
        mock_order.assert_called_once()


def test_send_postcard_builds_recipient_correctly():
    with (
        patch("couchers.postal.my_postcard._place_order") as mock_order,
        patch("couchers.postal.my_postcard._authenticate") as mock_auth,
        patch("couchers.postal.my_postcard.get_postcard_front_image") as mock_image,
    ):
        mock_image.return_value = b"fake-image"
        mock_auth.return_value = "auth-token"
        mock_order.return_value = {"job_id": 123}

        send_postcard(
            _context,
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
        patch("couchers.postal.my_postcard._authenticate") as mock_auth,
        patch("couchers.postal.my_postcard.get_postcard_front_image") as mock_image,
    ):
        mock_image.return_value = b"fake-image"
        mock_auth.return_value = "auth-token"
        mock_order.return_value = {"job_id": 123}

        send_postcard(
            _context,
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


def test_send_postcard_auth_failure():
    with (
        patch("couchers.postal.my_postcard._authenticate") as mock_auth,
        patch("couchers.postal.my_postcard.get_postcard_front_image") as mock_image,
    ):
        mock_image.return_value = b"fake-image"
        mock_auth.side_effect = RequestException("Connection refused")

        with pytest.raises(RequestException, match="Connection refused"):
            send_postcard(
                _context,
                recipient_name="Test User",
                address_line_1="123 Main St",
                address_line_2=None,
                city="Berlin",
                state=None,
                postal_code=None,
                country="DE",
                verification_code="ABC123",
            )


def test_send_postcard_order_failure():
    with (
        patch("couchers.postal.my_postcard._place_order") as mock_order,
        patch("couchers.postal.my_postcard._authenticate") as mock_auth,
        patch("couchers.postal.my_postcard.get_postcard_front_image") as mock_image,
    ):
        mock_image.return_value = b"fake-image"
        mock_auth.return_value = "auth-token"
        mock_order.side_effect = RequestException("500 Server Error")

        with pytest.raises(RequestException, match="500 Server Error"):
            send_postcard(
                _context,
                recipient_name="Test User",
                address_line_1="123 Main St",
                address_line_2=None,
                city="Berlin",
                state=None,
                postal_code=None,
                country="DE",
                verification_code="ABC123",
            )
