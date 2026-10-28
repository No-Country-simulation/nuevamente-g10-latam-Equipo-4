"""Only the server decides levels; UI presents this projection."""
import math


def progress(xp, completed):
    level = math.isqrt(xp // 100) + 1
    start = (level - 1) ** 2 * 100
    end = level ** 2 * 100
    return {"xp": xp, "completed": completed, "level": level,
            "level_start": start, "level_end": end,
            "level_percent": round(100 * (xp - start) / (end - start), 2)}
