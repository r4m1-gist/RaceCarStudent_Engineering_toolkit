#!/usr/bin/env python3
"""Calculate static hydraulic brake bias from caliper and rotor geometry."""

from __future__ import annotations

import argparse


def calculate_brake_bias(
    front_piston_area_mm2: float,
    rear_piston_area_mm2: float,
    front_effective_radius_mm: float,
    rear_effective_radius_mm: float,
    front_pad_mu: float = 0.45,
    rear_pad_mu: float = 0.45,
    front_line_pressure_bar: float = 1.0,
    rear_line_pressure_bar: float = 1.0,
    front_caliper_multiplier: float = 2.0,
    rear_caliper_multiplier: float = 1.0,
    front_disc_count: int = 2,
    rear_disc_count: int = 1,
) -> dict[str, float]:
    front_torque_factor = (
        front_line_pressure_bar
        * front_piston_area_mm2
        * front_caliper_multiplier
        * front_disc_count
        * front_effective_radius_mm
        * front_pad_mu
    )
    rear_torque_factor = (
        rear_line_pressure_bar
        * rear_piston_area_mm2
        * rear_caliper_multiplier
        * rear_disc_count
        * rear_effective_radius_mm
        * rear_pad_mu
    )
    total = front_torque_factor + rear_torque_factor
    if total <= 0:
        raise ValueError("Total brake torque factor must be positive.")

    return {
        "front_percent": 100.0 * front_torque_factor / total,
        "rear_percent": 100.0 * rear_torque_factor / total,
        "front_torque_factor": front_torque_factor,
        "rear_torque_factor": rear_torque_factor,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--front-piston-area-mm2", type=float, required=True)
    parser.add_argument("--rear-piston-area-mm2", type=float, required=True)
    parser.add_argument("--front-effective-radius-mm", type=float, required=True)
    parser.add_argument("--rear-effective-radius-mm", type=float, required=True)
    parser.add_argument("--front-pad-mu", type=float, default=0.45)
    parser.add_argument("--rear-pad-mu", type=float, default=0.45)
    parser.add_argument("--front-line-pressure-bar", type=float, default=1.0)
    parser.add_argument("--rear-line-pressure-bar", type=float, default=1.0)
    parser.add_argument("--front-caliper-multiplier", type=float, default=2.0)
    parser.add_argument("--rear-caliper-multiplier", type=float, default=1.0)
    parser.add_argument("--front-disc-count", type=int, default=2)
    parser.add_argument("--rear-disc-count", type=int, default=1)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    result = calculate_brake_bias(**vars(args))
    print(f"Front bias: {result['front_percent']:.1f}%")
    print(f"Rear bias:  {result['rear_percent']:.1f}%")
    print(f"Front torque factor: {result['front_torque_factor']:.1f}")
    print(f"Rear torque factor:  {result['rear_torque_factor']:.1f}")


if __name__ == "__main__":
    main()
