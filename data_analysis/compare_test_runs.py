#!/usr/bin/env python3
"""Compare summary metrics from two or more test-run CSV files."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


def as_float(value: str | None) -> float | None:
    if value in (None, ""):
        return None
    return float(value)


def summarize(path: Path) -> dict[str, float | str]:
    with path.open(newline="", encoding="utf-8") as csv_file:
        rows = list(csv.DictReader(csv_file))
    if not rows:
        raise ValueError(f"{path} is empty.")

    speeds = [value for row in rows if (value := as_float(row.get("speed_mps"))) is not None]
    accels = [value for row in rows if (value := as_float(row.get("accel_mps2"))) is not None]
    distances = [value for row in rows if (value := as_float(row.get("distance_m"))) is not None]
    times = [value for row in rows if (value := as_float(row.get("time_s"))) is not None]

    return {
        "run": path.name,
        "duration_s": max(times) - min(times) if times else 0.0,
        "max_speed_kph": max(speeds) * 3.6 if speeds else 0.0,
        "max_accel_mps2": max(accels) if accels else 0.0,
        "final_distance_m": distances[-1] if distances else 0.0,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_paths", nargs="+", type=Path)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    summaries = [summarize(path) for path in args.csv_paths]
    print(f"{'run':30} {'duration_s':>10} {'max_kph':>10} {'max_accel':>10} {'distance_m':>11}")
    print("-" * 77)
    for item in summaries:
        print(
            f"{item['run']:<30} "
            f"{item['duration_s']:>10.2f} "
            f"{item['max_speed_kph']:>10.1f} "
            f"{item['max_accel_mps2']:>10.2f} "
            f"{item['final_distance_m']:>11.1f}"
        )


if __name__ == "__main__":
    main()
