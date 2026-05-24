# RaceCarStudent Engineering Toolkit

Practical calculators, data-analysis scripts, and documentation templates for
Formula Student Korea (FSK), Baja Student Korea (BSK), and other student race
car teams.

The tools are intentionally lightweight: each Python file can be run directly
from the command line and uses common engineering inputs.

## Project layout

```text
calculators/
  brake_bias_calculator.py
  gear_ratio_accel_sim.py
  spring_rate_calculator.py
  motion_ratio_calculator.py
data_analysis/
  plot_acceleration_log.py
  plot_brake_test.py
  compare_test_runs.py
templates/
  design_review_template.md
  test_log_template.csv
  failure_report_template.md
  manufacturing_checklist.md
examples/
  sample_vehicle_config.yaml
  sample_test_log.csv
```

## Requirements

Most calculators only need Python 3.10+. Plotting scripts require:

```bash
python -m pip install matplotlib
```

`compare_test_runs.py` can read CSV files with the Python standard library. If
PyYAML is installed, `gear_ratio_accel_sim.py` can also read YAML config files.

```bash
python -m pip install pyyaml
```

## Quick examples

For a no-install user interface, open the web toolkit:

```bash
open web/index.html
```

Or double-click `web/index.html` in Finder.

The web version is designed for the common student-team workflow: fill in
variables in a table-like form and read the result immediately.

Current web calculators:

- Brake bias
- Spring rate from target wheel rate
- Motion ratio from measured travel
- EV chain drive layout for 420 / 428 / 520 chain, including recommended link
  count, center distance, final drive ratio, and small sprocket wrap angle

## Command-line examples

Brake bias:

```bash
python calculators/brake_bias_calculator.py \
  --front-piston-area-mm2 1800 \
  --rear-piston-area-mm2 1200 \
  --front-effective-radius-mm 95 \
  --rear-effective-radius-mm 85
```

Spring rate:

```bash
python calculators/spring_rate_calculator.py --wheel-rate-n-mm 35 --motion-ratio 0.78
```

Acceleration simulation:

```bash
python calculators/gear_ratio_accel_sim.py --config examples/sample_vehicle_config.yaml
```

Plot a test log:

```bash
python data_analysis/plot_acceleration_log.py examples/sample_test_log.csv
python data_analysis/plot_brake_test.py examples/sample_test_log.csv
```

Compare two runs:

```bash
python data_analysis/compare_test_runs.py examples/sample_test_log.csv examples/sample_test_log.csv
```

## CSV data format

The included analysis scripts expect a CSV with these columns where available:

- `time_s`
- `speed_mps`
- `accel_mps2`
- `brake_pressure_front_bar`
- `brake_pressure_rear_bar`
- `distance_m`

Extra columns are ignored, so teams can keep one shared data log format.
