from couchers.jobs.email import process_send_email
from couchers.models import BackgroundJobType
from pb import jobs_pb2

# job definitions, tuples of (BackgroundJobType, message, function)
JOBS = {BackgroundJobType.send_email: (jobs_pb2.SendEmailPayload, process_send_email)}
