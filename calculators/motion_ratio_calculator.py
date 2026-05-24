#!/usr/bin/env python3
"""Calculate suspension motion ratio from measured wheel and spring travel."""

from __future__ import annotations

import argparse


def calculate_motion_ratio(wheel_travel_mm: float, spring_travel_mm: float) -> dict[str, float]:
    if wheel_travel_mm <= 0:
        raise ValueError("Wheel travel must be positive.")
    if spring_travel_mm <= 0:
        raise ValueError("Spring travel must be positive.")

    motion_ratio = spring_travel_mm / wheel_travel_mm
    installation_ratio = wheel_travel_mm / spring_travel_mm
    return {
        "motion_ratio": motion_ratio,
        "installation_ratio": installation_ratio,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--wheel-travel-mm", type=float, required=True)
    parser.add_argument("--spring-travel-mm", type=float, required=True)
    return parser


def main() -> None:
    result = calculate_motion_ratio(**vars(build_parser().parse_args()))
    print(f"Motion ratio (spring/wheel): {result['motion_ratio']:.3f}")
    print(f"Installation ratio (wheel/spring): {result['installation_ratio']:.3f}")


if __name__ == "__main__":
    main()
