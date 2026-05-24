# RaceCarStudent Engineering Toolkit

Practical calculators, data-analysis scripts, and documentation templates for
Formula Student Korea (FSK), Baja Student Korea (BSK), and other student race
car teams.

The main workflow is a lightweight web app built with HTML, CSS, and
JavaScript. During development it is previewed with Python's local static
server, and the same files can later be deployed with GitHub Pages.

Korean documentation is available in [README_KOR.md](README_KOR.md).

## Project layout

```text
web/
  index.html
  styles.css
  app.js
  assets/
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

## Web toolkit

The web app is the primary user interface. It is designed for student-team
workflows where users fill values into table-like forms and read results
immediately.

Current sections:

- Intro
- Calculators
- Checklists
- Data Analysis

Current calculators:

- Brake bias, including caliper type and disc count
- Spring rate from target wheel rate
- Motion ratio from measured travel
- EV chain drive layout for 420 / 428 / 520 chain, including recommended link
  count, center distance, final drive ratio, and small sprocket wrap angle

## Local demo workflow

Use the Python static server for local demos:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/web/index.html
```

The local demo and deployed version use the same source files. Do not maintain a
separate demo copy of the app.

## GitHub Pages deployment

This project can be deployed as a static site with GitHub Pages.

Recommended flow:

1. Push changes to GitHub.
2. Open the repository settings on GitHub.
3. Go to `Pages`.
4. Choose `Deploy from a branch`.
5. Select the target branch, usually `main`.
6. Use the repository root as the source.
7. Open the generated GitHub Pages URL.

The app entry point is:

```text
web/index.html
```

## Requirements

The web toolkit only needs a browser.

Python 3 is used for local static serving and optional command-line tools.
Plotting scripts require:

```bash
python -m pip install matplotlib
```

`compare_test_runs.py` can read CSV files with the Python standard library. If
PyYAML is installed, `gear_ratio_accel_sim.py` can also read YAML config files.

```bash
python -m pip install pyyaml
```

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
