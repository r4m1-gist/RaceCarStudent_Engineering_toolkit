#!/usr/bin/env python3
"""Plot speed and brake pressures from a braking test CSV."""

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


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_path", type=Path)
    parser.add_argument("--output", type=Path, help="Save plot instead of showing it")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    with args.csv_path.open(newline="", encoding="utf-8") as csv_file:
        rows = list(csv.DictReader(csv_file))

    time_s = read_float_column(rows, "time_s")
    speed_kph = [v * 3.6 for v in read_float_column(rows, "speed_mps")]
    front_pressure = read_float_column(rows, "brake_pressure_front_bar")
    rear_pressure = read_float_column(rows, "brake_pressure_rear_bar")

    fig, speed_ax = plt.subplots(figsize=(9, 5))
    pressure_ax = speed_ax.twinx()
    speed_ax.plot(time_s, speed_kph, label="Speed", color="#1f77b4")
    pressure_ax.plot(time_s, front_pressure, label="Front pressure", color="#2ca02c")
    pressure_ax.plot(time_s, rear_pressure, label="Rear pressure", color="#ff7f0e")

    speed_ax.set_xlabel("Time (s)")
    speed_ax.set_ylabel("Speed (km/h)")
    pressure_ax.set_ylabel("Brake pressure (bar)")
    speed_ax.grid(True, alpha=0.3)
    lines = speed_ax.get_lines() + pressure_ax.get_lines()
    fig.legend(lines, [line.get_label() for line in lines], loc="upper right")
    fig.tight_layout()

    if args.output:
        fig.savefig(args.output, dpi=160)
        print(f"Wrote {args.output}")
    else:
        plt.show()


if __name__ == "__main__":
    main()
