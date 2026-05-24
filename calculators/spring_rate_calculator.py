#!/usr/bin/env python3
"""Convert between wheel rate and spring rate using suspension motion ratio."""

from __future__ import annotations

import argparse


def spring_rate_from_wheel_rate(
    wheel_rate_n_mm: float,
    motion_ratio: float,
    tire_rate_n_mm: float | None = None,
) -> dict[str, float]:
    if wheel_rate_n_mm <= 0:
        raise ValueError("Wheel rate must be positive.")
    if motion_ratio <= 0:
        raise ValueError("Motion ratio must be positive.")

    suspension_wheel_rate = wheel_rate_n_mm
    if tire_rate_n_mm:
        if tire_rate_n_mm <= wheel_rate_n_mm:
            raise ValueError("Tire rate must be greater than target wheel rate.")
        suspension_wheel_rate = 1.0 / ((1.0 / wheel_rate_n_mm) - (1.0 / tire_rate_n_mm))

    spring_rate = suspension_wheel_rate / (motion_ratio**2)
    return {
        "spring_rate_n_mm": spring_rate,
        "suspension_wheel_rate_n_mm": suspension_wheel_rate,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--wheel-rate-n-mm", type=float, required=True)
    parser.add_argument("--motion-ratio", type=float, required=True, help="Spring travel / wheel travel")
    parser.add_argument("--tire-rate-n-mm", type=float, help="Optional tire vertical rate")
    return parser


def main() -> None:
    result = spring_rate_from_wheel_rate(**vars(build_parser().parse_args()))
    print(f"Required spring rate: {result['spring_rate_n_mm']:.1f} N/mm")
    print(f"Suspension wheel rate: {result['suspension_wheel_rate_n_mm']:.1f} N/mm")


if __name__ == "__main__":
    main()
