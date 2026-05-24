#!/usr/bin/env python3
"""Plot speed and acceleration from a race car test log CSV."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

import matplotlib.pyplot as plt


def read_float_column(rows: list[dict[str, str]], name: str) -> list[float]:
    values: list[float] = []
    for row in rows:
        value = row.get(name, "")
        values.append(float(value) if value != "" else float("nan"))
    return values


def load_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as csv_file:
        return list(csv.DictReader(csv_file))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_path", type=Path)
    parser.add_argument("--output", type=Path, help="Save plot instead of showing it")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    rows = load_rows(args.csv_path)
    time_s = read_float_column(rows, "time_s")
    speed_mps = read_float_column(rows, "speed_mps")
    accel_mps2 = read_float_column(rows, "accel_mps2")

    fig, speed_ax = plt.subplots(figsize=(9, 5))
    accel_ax = speed_ax.twinx()
    speed_ax.plot(time_s, [v * 3.6 for v in speed_mps], label="Speed", color="#1f77b4")
    accel_ax.plot(time_s, accel_mps2, label="Acceleration", color="#d62728")

    speed_ax.set_xlabel("Time (s)")
    speed_ax.set_ylabel("Speed (km/h)")
    accel_ax.set_ylabel("Acceleration (m/s^2)")
    speed_ax.grid(True, alpha=0.3)
    fig.tight_layout()

    if args.output:
        fig.savefig(args.output, dpi=160)
        print(f"Wrote {args.output}")
    else:
        plt.show()


if __name__ == "__main__":
    main()
