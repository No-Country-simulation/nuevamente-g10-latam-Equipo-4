class ConflictError(ValueError):
    """Valid command that cannot be applied to the current domain state."""
    status_code = 409
