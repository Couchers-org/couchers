from couchers.crypto import UNSUBSCRIBE_KEY, verify_hash_signature

def generate_unsubscribe_link():
    pass


def unsubscribe(request, context):
    if not verify_hash_signature(payload=request.payload, key=UNSUBSCRIBE_KEY, sig=request.sig):
        context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.WRONG_SIGNATURE)
    payload = 
    pass
