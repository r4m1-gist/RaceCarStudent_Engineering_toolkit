# RaceCarStudent Engineering Toolkit

Static web demo for Formula Student Korea (FSK), Baja Student Korea (BSK), and
student race car setup work.

The toolkit runs in the browser with HTML, CSS, and JavaScript only. There is no
Python runtime, install step, build step, or backend server required for the
current demo.

Korean documentation is available in [README_KOR.md](README_KOR.md).

## License

This project is source-available for viewing, reference, and educational review
only. Use, modification, redistribution, deployment, hosting, or commercial use
requires prior written permission from the copyright holder.

Project logos, names, marks, branding assets, and related visual identity
materials are also reserved and may not be used without prior written
permission. See [LICENSE](LICENSE).

## Live Demo

Open the current GitHub Pages build:

https://r4m1-gist.github.io/RaceCarStudent_Engineering_Toolkit/web/index.html

## Project layout

```text
web/
  index.html
  styles.css
  app.js
  assets/
README.md
README_KOR.md
LICENSE
```

## Web toolkit

Current sections:

- Intro
- Calculators
- Checklists
- Data Analysis

Current calculators:

- Brake bias, including caliper type and disc count
- Spring rate from target wheel rate
- Motion ratio from measured travel
- Geometry setup from coordinate inputs, including CG, yaw rate, lateral
  acceleration, and a simple yaw torque estimate
- Steering setup for steering ratio, Ackermann percent, measured turn radius,
  rack travel, and ideal inner / outer wheel angles
- EV chain drive layout for 420 / 428 / 520 chain, including recommended link
  count, center distance, final drive ratio, and small sprocket wrap angle
- Speed / RPM from motor speed, final drive ratio, and tire diameter
- Tractive force and simple acceleration estimate from motor torque, gearing,
  tire radius, vehicle mass, and traction limit
- Battery runtime and usable energy estimate from pack voltage, capacity,
  usable SOC, average power, and event time

The Data Analysis view parses uploaded log, CSV, JSON, and numeric text files in
the browser. Files stay local to the current browser session.

## Local demo

Open the app entry file in a browser:

```text
web/index.html
```

If a local static server is preferred, serve the repository root and open:

```text
http://localhost:8000/web/index.html
```

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
