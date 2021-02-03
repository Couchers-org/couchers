from couchers.jobs.worker import start_job_servicer


def run_background():
    bg = start_job_servicer()
    return bg
