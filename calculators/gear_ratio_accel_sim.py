#!/usr/bin/env python3
"""Simple straight-line acceleration simulation for gear ratio studies."""

from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path
from typing import Any


DEFAULT_CONFIG: dict[str, Any] = {
    "vehicle_mass_kg": 230.0,
    "driver_mass_kg": 75.0,
    "wheel_radius_m": 0.235,
    "final_drive_ratio": 3.7,
    "gear_ratios": [2.80, 2.05, 1.60, 1.32, 1.13, 0.96],
    "drivetrain_efficiency": 0.88,
    "shift_rpm": 11500,
    "redline_rpm": 12000,
    "idle_rpm": 3500,
    "drag_coefficient": 0.85,
    "frontal_area_m2": 1.05,
    "rolling_resistance_coefficient": 0.018,
    "air_density_kg_m3": 1.225,
    "time_step_s": 0.02,
    "duration_s": 12.0,
    "engine_torque_curve_nm": [
        [3500, 35],
        [5000, 52],
        [7000, 66],
        [9000, 70],
        [11000, 64],
        [12000, 55],
    ],
}


def interpolate_curve(curve: list[list[float]], rpm: float) -> float:
    points = sorted((float(x), float(y)) for x, y in curve)
    if rpm <= points[0][0]:
        return points[0][1]
    if rpm >= points[-1][0]:
        return points[-1][1]
    for (rpm_a, torque_a), (rpm_b, torque_b) in zip(points, points[1:]):
        if rpm_a <= rpm <= rpm_b:
            span = rpm_b - rpm_a
            return torque_a + ((rpm - rpm_a) / span) * (torque_b - torque_a)
    return points[-1][1]


def load_config(path: Path | None) -> dict[str, Any]:
    if path is None:
        return dict(DEFAULT_CONFIG)
    text = path.read_text(encoding="utf-8")
    if path.suffix.lower() == ".json":
        loaded = json.loads(text)
    else:
        try:
            import yaml  # type: ignore
        except ImportError as exc:
            raise SystemExit("Install PyYAML or provide a JSON config file.") from exc
        loaded = yaml.safe_load(text)
    config = dict(DEFAULT_CONFIG)
    config.update(loaded or {})
    return config


def engine_rpm(speed_mps: float, gear_ratio: float, final_drive_ratio: float, wheel_radius_m: float) -> float:
    wheel_rad_s = speed_mps / wheel_radius_m
    engine_rad_s = wheel_rad_s * gear_ratio * final_drive_ratio
    return engine_rad_s * 60.0 / (2.0 * math.pi)


def simulate(config: dict[str, Any]) -> list[dict[str, float]]:
    mass = float(config["vehicle_mass_kg"]) + float(config.get("driver_mass_kg", 0.0))
    wheel_radius = float(config["wheel_radius_m"])
    final_drive = float(config["final_drive_ratio"])
    gears = [float(value) for value in config["gear_ratios"]]
    efficiency = float(config["drivetrain_efficiency"])
    shift_rpm = float(config["shift_rpm"])
    idle_rpm = float(config["idle_rpm"])
    dt = float(config["time_step_s"])
    duration = float(config["duration_s"])
    rho = float(config["air_density_kg_m3"])
    cd = float(config["drag_coefficient"])
    area = float(config["frontal_area_m2"])
    crr = float(config["rolling_resistance_coefficient"])
    torque_curve = config["engine_torque_curve_nm"]

    time_s = 0.0
    speed = 0.0
    distance = 0.0
    gear_index = 0
    rows: list[dict[str, float]] = []

    while time_s <= duration:
        gear_ratio = gears[gear_index]
        rpm = max(idle_rpm, engine_rpm(speed, gear_ratio, final_drive, wheel_radius))
        if rpm >= shift_rpm and gear_index < len(gears) - 1:
            gear_index += 1
            gear_ratio = gears[gear_index]
            rpm = max(idle_rpm, engine_rpm(speed, gear_ratio, final_drive, wheel_radius))

        engine_torque = interpolate_curve(torque_curve, rpm)
        wheel_force = engine_torque * gear_ratio * final_drive * efficiency / wheel_radius
        drag_force = 0.5 * rho * cd * area * speed**2
        rolling_force = mass * 9.80665 * crr
        accel = max((wheel_force - drag_force - rolling_force) / mass, 0.0)

        rows.append(
            {
                "time_s": time_s,
                "speed_mps": speed,
                "speed_kph": speed * 3.6,
                "distance_m": distance,
                "accel_mps2": accel,
                "gear": float(gear_index + 1),
                "rpm": rpm,
            }
        )

        speed += accel * dt
        distance += speed * dt
        time_s += dt

    return rows


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, help="YAML or JSON vehicle config")
    parser.add_argument("--output", type=Path, help="Optional CSV output path")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    rows = simulate(load_config(args.config))
    last = rows[-1]
    print(f"Final speed: {last['speed_kph']:.1f} km/h")
    print(f"Distance: {last['distance_m']:.1f} m")
    print(f"Last gear: {int(last['gear'])}")
    if args.output:
        with args.output.open("w", newline="", encoding="utf-8") as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)
        print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
