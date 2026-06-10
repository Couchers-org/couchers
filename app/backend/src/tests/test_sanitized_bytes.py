from google.protobuf import empty_pb2

from couchers.interceptors import _sanitized_bytes
from couchers.proto import api_pb2, auth_pb2, conversations_pb2


class TestSanitizedBytes:
    """Test suite for _sanitized_bytes function."""

    def test_none_input(self):
        """Test that None input returns None."""
        result = _sanitized_bytes(None)
        assert result is None

    def test_empty_message(self):
        """Test that an empty message is serialized correctly."""
        proto = empty_pb2.Empty()
        result = _sanitized_bytes(proto)

        assert isinstance(result, bytes)
        # Verify we can deserialize it back
        deserialized = empty_pb2.Empty.FromString(result)
        assert deserialized == proto

    def test_message_with_no_sensitive_fields(self):
        """Test that messages without sensitive fields are not modified."""
        # AuthRes has no sensitive fields
        proto = auth_pb2.AuthRes(user_id=12345, jailed=False)
        result = _sanitized_bytes(proto)

        deserialized = auth_pb2.AuthRes.FromString(result)
        assert deserialized.user_id == 12345
        assert deserialized.jailed is False

    def test_message_with_sensitive_field(self):
        """Test that sensitive fields are cleared from messages."""
        # AuthReq has a sensitive password field
        proto = auth_pb2.AuthReq(user="testuser", password="supersecret123", remember_device=True)
        # the plaintext is present in the wire bytes unsanitized, but must not survive sanitization
        assert b"supersecret123" in proto.SerializeToString()
        result = _sanitized_bytes(proto)
        assert b"supersecret123" not in result

        deserialized = auth_pb2.AuthReq.FromString(result)

        # Non-sensitive fields should remain
        assert deserialized.user == "testuser"
        assert deserialized.remember_device is True

        # Sensitive field should be cleared
        assert deserialized.password == ""

    def test_message_with_nested_message_non_repeated(self):
        """Test that nested messages are recursively sanitized (non-repeated case)."""
        # SignupFlowReq contains a nested SignupAccount message
        proto = auth_pb2.SignupFlowReq(
            flow_token="token123",
            account=auth_pb2.SignupAccount(username="nesteduser", password="nestedsecret", city="Boston"),
        )
        assert b"nestedsecret" in proto.SerializeToString()
        result = _sanitized_bytes(proto)
        assert b"nestedsecret" not in result

        deserialized = auth_pb2.SignupFlowReq.FromString(result)

        # Top-level fields should remain
        assert deserialized.flow_token == "token123"

        # Nested message non-sensitive fields should remain
        assert deserialized.account.username == "nesteduser"
        assert deserialized.account.city == "Boston"

        # Nested message sensitive field should be cleared
        assert deserialized.account.password == ""

    def test_message_with_empty_nested_message(self):
        """Test that empty nested message fields don't cause errors (continue branch)."""
        # Create a message where nested message field is default/empty
        # SignupFlowRes with auth_res not set (optional field)
        proto = auth_pb2.SignupFlowRes(
            flow_token="token456",
            need_basic=True,
            need_account=False,
            # auth_res is not set
        )
        result = _sanitized_bytes(proto)

        deserialized = auth_pb2.SignupFlowRes.FromString(result)
        assert deserialized.flow_token == "token456"
        assert deserialized.need_basic is True
        assert deserialized.need_account is False
        # auth_res should still be empty/default
        assert not deserialized.HasField("auth_res")

    def test_message_with_empty_repeated_field(self):
        """
        Test that empty repeated message fields trigger the continue branch.

        This covers line 171-172 where submessage evaluates to False (empty list).
        """
        # Create a message with a repeated field but don't add any items
        proto = conversations_pb2.GetGroupChatMessagesRes(
            last_message_id=999,
            no_more=True,
            # messages field is empty (default empty repeated field)
        )
        result = _sanitized_bytes(proto)

        deserialized = conversations_pb2.GetGroupChatMessagesRes.FromString(result)
        assert deserialized.last_message_id == 999
        assert deserialized.no_more is True
        # Repeated field should be empty
        assert len(deserialized.messages) == 0

    def test_message_with_repeated_messages(self):
        """Test that repeated message fields are recursively sanitized."""
        # Create a message with repeated nested messages
        # Using GetGroupChatMessagesRes which has repeated Message fields
        proto = conversations_pb2.GetGroupChatMessagesRes(last_message_id=100, no_more=False)

        # Add messages to the repeated field
        msg1 = proto.messages.add()
        msg1.message_id = 1
        msg1.author_user_id = 123
        msg1.text.text = "Hello"

        msg2 = proto.messages.add()
        msg2.message_id = 2
        msg2.author_user_id = 456
        msg2.text.text = "World"

        result = _sanitized_bytes(proto)

        deserialized = conversations_pb2.GetGroupChatMessagesRes.FromString(result)

        # Check that repeated messages are preserved
        assert len(deserialized.messages) == 2
        assert deserialized.messages[0].message_id == 1
        assert deserialized.messages[0].text.text == "Hello"
        assert deserialized.messages[0].author_user_id == 123
        assert deserialized.messages[1].message_id == 2
        assert deserialized.messages[1].text.text == "World"
        assert deserialized.messages[1].author_user_id == 456

    def test_deeply_nested_messages(self):
        """Test that deeply nested messages are recursively sanitized."""
        # SignupFlowRes contains AuthRes which is nested
        proto = auth_pb2.SignupFlowRes(
            flow_token="deep_token",
            auth_res=auth_pb2.AuthRes(user_id=789, jailed=False),
            need_basic=False,
            need_account=True,
        )
        result = _sanitized_bytes(proto)

        deserialized = auth_pb2.SignupFlowRes.FromString(result)

        # All nested data should be preserved (no sensitive fields in this structure)
        assert deserialized.flow_token == "deep_token"
        assert deserialized.auth_res.user_id == 789
        assert deserialized.auth_res.jailed is False
        assert deserialized.need_basic is False
        assert deserialized.need_account is True

    def test_multiple_nested_messages_with_sensitive_fields(self):
        """
        Test sanitization when a message has multiple nested messages with sensitive fields.

        This ensures the function properly handles multiple different nested message fields.
        """
        # Create a SignupFlowReq with multiple nested messages
        proto = auth_pb2.SignupFlowReq(
            flow_token="repeat_token",
            basic=auth_pb2.SignupBasic(name="Test User", email="test@example.com"),
            account=auth_pb2.SignupAccount(username="testuser", password="shouldberemoved"),
        )
        assert b"shouldberemoved" in proto.SerializeToString()
        result = _sanitized_bytes(proto)
        assert b"shouldberemoved" not in result

        deserialized = auth_pb2.SignupFlowReq.FromString(result)

        # Check basic nested message
        assert deserialized.basic.name == "Test User"
        assert deserialized.basic.email == "test@example.com"

        # Check account nested message with sensitive field
        assert deserialized.account.username == "testuser"
        assert deserialized.account.password == ""

    def test_message_preserves_original(self):
        """Test that the original message is not modified (deepcopy is used)."""
        original = auth_pb2.AuthReq(user="original_user", password="original_password")

        # Store original values
        original_user = original.user
        original_password = original.password

        assert b"original_password" in original.SerializeToString()
        # Call _sanitized_bytes
        result = _sanitized_bytes(original)
        assert b"original_password" not in result

        # Original should not be modified
        assert original.user == original_user
        assert original.password == original_password

        # But the result should have password cleared
        deserialized = auth_pb2.AuthReq.FromString(result)
        assert deserialized.user == original_user
        assert deserialized.password == ""

    def test_message_with_non_message_type_fields(self):
        """Test messages with primitive fields (no message_type)."""
        # Create a message with only primitive types
        proto = auth_pb2.AuthRes(user_id=12345, jailed=True)
        result = _sanitized_bytes(proto)

        deserialized = auth_pb2.AuthRes.FromString(result)
        assert deserialized.user_id == 12345
        assert deserialized.jailed is True

    def test_complex_nested_structure(self):
        """Test a complex nested structure to ensure all branches are covered."""
        # Create a complex nested message
        proto = auth_pb2.SignupFlowReq(
            flow_token="complex_token",
            basic=auth_pb2.SignupBasic(name="Complex User", email="complex@example.com", invite_code="INVITE123"),
            account=auth_pb2.SignupAccount(
                username="complexuser",
                password="complexsecret",
                city="Seattle",
                lat=47.6062,
                lng=-122.3321,
                birthdate="1985-05-15",
                gender="other",
                hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                accept_tos=True,
            ),
            feedback=auth_pb2.ContributorForm(ideas="Great platform!", contribute=auth_pb2.CONTRIBUTE_OPTION_YES),
            email_token="email_verification_token",
        )

        assert b"complexsecret" in proto.SerializeToString()
        result = _sanitized_bytes(proto)
        assert b"complexsecret" not in result

        deserialized = auth_pb2.SignupFlowReq.FromString(result)

        # Verify all non-sensitive fields are preserved
        assert deserialized.flow_token == "complex_token"
        assert deserialized.basic.name == "Complex User"
        assert deserialized.basic.email == "complex@example.com"
        assert deserialized.basic.invite_code == "INVITE123"
        assert deserialized.account.username == "complexuser"
        assert deserialized.account.city == "Seattle"
        assert deserialized.account.lat == 47.6062
        assert deserialized.account.birthdate == "1985-05-15"
        assert deserialized.feedback.ideas == "Great platform!"
        assert deserialized.email_token == "email_verification_token"

        # Verify sensitive field is cleared
        assert deserialized.account.password == ""
