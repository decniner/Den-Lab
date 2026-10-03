"""Temporary test directories compatible with Windows restricted execution tokens."""
import shutil
import uuid
from contextlib import contextmanager
from pathlib import Path


@contextmanager
def temporary_directory():
    root = Path(__file__).resolve().parent
    path = root / ("test-tmp-" + uuid.uuid4().hex)
    path.mkdir()
    try:
        yield str(path)
    finally:
        if not path.resolve().is_relative_to(root):
            raise RuntimeError("Test cleanup target escaped the workspace")
        shutil.rmtree(path)
