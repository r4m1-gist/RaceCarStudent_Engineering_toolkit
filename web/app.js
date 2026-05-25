const viewTitles = {
  intro: "Intro",
  calculators: "Calculators",
  checklists: "Checklists",
  analysis: "Data Analysis",
};

const calcTitles = {
  brake: "Brake Bias",
  spring: "Spring Rate",
  motion: "Motion Ratio",
  geometry: "Geometry Setup",
  steering: "Steering Setup",
  chain: "Chain Drive",
};

const chainSizes = {
  420: { pitchMm: 12.7, rollerWidthMm: 6.35 },
  428: { pitchMm: 12.7, rollerWidthMm: 7.75 },
  520: { pitchMm: 15.875, rollerWidthMm: 6.35 },
};

const monolithLog = {
  magic: 0xae,
  size: 24,
  types: ["INVALID", "BOOT", "CAN", "GPS", "ANALOG", "DIGITAL", "GYROSCOPE", "SYSTEM", "USER_EVENT"],
};

const defaults = new Map();
const analysisState = {
  rows: [],
  columns: [],
  numericColumns: [],
  fileName: "",
};

function numberValue(form, name) {
  const value = Number(form.elements[name].value);
  return Number.isFinite(value) ? value : 0;
}

function integerValue(form, name) {
  return Math.round(numberValue(form, name));
}

function format(value, digits = 1, suffix = "") {
  if (!Number.isFinite(value)) return "-";
  return `${value.toFixed(digits)}${suffix}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function compactNumber(value) {
  if (!Number.isFinite(value)) return "-";
  if (Math.abs(value) >= 1000 || (Math.abs(value) > 0 && Math.abs(value) < 0.01)) {
    return value.toExponential(2);
  }
  return Number(value.toFixed(3)).toString();
}

function saveDefaults() {
  document.querySelectorAll("form").forEach((form) => {
    defaults.set(form.dataset.form, new FormData(form));
  });
}

function resetForm(tool) {
  const form = document.querySelector(`[data-form="${tool}"]`);
  const saved = defaults.get(tool);
  if (!form || !saved) return;
  for (const [key, value] of saved.entries()) {
    form.elements[key].value = value;
  }
  updateAll();
}

let activeCalc = "brake";

function activateView(view) {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  document.querySelectorAll(".view-section").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.viewPanel === view);
  });
  document.querySelector("#tool-title").textContent = view === "calculators" ? calcTitles[activeCalc] : viewTitles[view];
  const resetButton = document.querySelector("#reset-tool");
  resetButton.dataset.calc = activeCalc;
  resetButton.classList.toggle("is-hidden", view !== "calculators");
}

function activateCalc(calc) {
  activeCalc = calc;
  document.querySelectorAll(".calc-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.calc === calc);
  });
  document.querySelectorAll(".calc-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.calcPanel === calc);
  });
  const calculatorViewActive = document.querySelector('[data-view-panel="calculators"]').classList.contains("active");
  if (calculatorViewActive) {
    document.querySelector("#tool-title").textContent = calcTitles[calc];
    document.querySelector("#reset-tool").dataset.calc = calc;
  }
}

function updateBrake() {
  const form = document.querySelector('[data-form="brake"]');
  const pedalForce = numberValue(form, "pedalForce");
  const pedalRatio = numberValue(form, "pedalRatio");
  const frontMasterBore = numberValue(form, "frontMasterBore");
  const rearMasterBore = numberValue(form, "rearMasterBore");
  const frontBalance = Math.min(Math.max(numberValue(form, "frontBalance"), 0), 100) / 100;
  const frontMasterArea = frontMasterBore > 0 ? Math.PI * (frontMasterBore / 2) ** 2 : 0;
  const rearMasterArea = rearMasterBore > 0 ? Math.PI * (rearMasterBore / 2) ** 2 : 0;
  const pedalOutputForce = pedalForce * pedalRatio;
  const frontCalculatedPressure =
    pedalOutputForce > 0 && frontMasterArea > 0 ? ((pedalOutputForce * frontBalance) / frontMasterArea) * 10 : NaN;
  const rearCalculatedPressure =
    pedalOutputForce > 0 && rearMasterArea > 0 ? ((pedalOutputForce * (1 - frontBalance)) / rearMasterArea) * 10 : NaN;
  const frontPressure = Number.isFinite(frontCalculatedPressure) ? frontCalculatedPressure : numberValue(form, "frontPressure");
  const rearPressure = Number.isFinite(rearCalculatedPressure) ? rearCalculatedPressure : numberValue(form, "rearPressure");

  const front =
    numberValue(form, "frontArea") *
    numberValue(form, "frontCaliperMultiplier") *
    integerValue(form, "frontDiscs") *
    numberValue(form, "frontRadius") *
    numberValue(form, "frontMu") *
    frontPressure;
  const rear =
    numberValue(form, "rearArea") *
    numberValue(form, "rearCaliperMultiplier") *
    integerValue(form, "rearDiscs") *
    numberValue(form, "rearRadius") *
    numberValue(form, "rearMu") *
    rearPressure;
  const total = front + rear;
  const frontPercent = total > 0 ? (front / total) * 100 : 0;
  const rearPercent = total > 0 ? (rear / total) * 100 : 0;
  const frontTorque = front * 0.0001;
  const rearTorque = rear * 0.0001;
  const tireRadiusM = numberValue(form, "tireRadius") / 1000;
  const vehicleMass = numberValue(form, "vehicleMass");
  const totalBrakeForce = tireRadiusM > 0 ? (frontTorque + rearTorque) / tireRadiusM : NaN;
  const decelG = vehicleMass > 0 ? totalBrakeForce / (vehicleMass * 9.80665) : NaN;

  document.querySelector("#brake-front").textContent = format(frontPercent, 1, "%");
  document.querySelector("#brake-rear").textContent = format(rearPercent, 1, "%");
  document.querySelector("#brake-front-factor").textContent = format(front, 0);
  document.querySelector("#brake-rear-factor").textContent = format(rear, 0);
  document.querySelector("#brake-front-pressure").textContent = format(frontPressure, 1, " bar");
  document.querySelector("#brake-rear-pressure").textContent = format(rearPressure, 1, " bar");
  document.querySelector("#brake-front-torque").textContent = format(frontTorque, 1, " Nm");
  document.querySelector("#brake-rear-torque").textContent = format(rearTorque, 1, " Nm");
  document.querySelector("#brake-total-force").textContent = format(totalBrakeForce, 0, " N");
  document.querySelector("#brake-decel").textContent = format(decelG, 2, " g");
  document.querySelector("#brake-front-bar").style.width = `${frontPercent}%`;
  document.querySelector("#brake-rear-bar").style.width = `${rearPercent}%`;
}

function updateSpring() {
  const form = document.querySelector('[data-form="spring"]');
  const wheelRate = numberValue(form, "wheelRate");
  const motionRatio = numberValue(form, "motionRatio");
  const tireRate = numberValue(form, "tireRate");
  let suspensionWheelRate = wheelRate;

  if (tireRate > wheelRate && wheelRate > 0) {
    suspensionWheelRate = 1 / (1 / wheelRate - 1 / tireRate);
  }

  const springRate = motionRatio > 0 ? suspensionWheelRate / motionRatio ** 2 : NaN;
  document.querySelector("#spring-rate").textContent = format(springRate, 1, " N/mm");
  document.querySelector("#suspension-wheel-rate").textContent = format(suspensionWheelRate, 1, " N/mm");
}

function updateMotion() {
  const form = document.querySelector('[data-form="motion"]');
  const wheelTravel = numberValue(form, "wheelTravel");
  const springTravel = numberValue(form, "springTravel");
  const motionRatio = wheelTravel > 0 ? springTravel / wheelTravel : NaN;
  const installationRatio = springTravel > 0 ? wheelTravel / springTravel : NaN;

  document.querySelector("#motion-ratio").textContent = format(motionRatio, 3);
  document.querySelector("#installation-ratio").textContent = format(installationRatio, 3);
}

function point2d(form, prefix) {
  return {
    x: numberValue(form, `${prefix}X`) / 1000,
    y: numberValue(form, `${prefix}Y`) / 1000,
  };
}

function midpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function distance2d(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function signedDeg(radians, direction) {
  const sign = direction === "right" ? -1 : 1;
  return (radians * 180 * sign) / Math.PI;
}

function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function parseMassPoints(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const parts = line.split(/[,\t ]+/).filter(Boolean);
      const offset = Number.isFinite(Number(parts[0])) ? 0 : 1;
      const x = Number(parts[offset]);
      const y = Number(parts[offset + 1]);
      const z = Number(parts[offset + 2]);
      const mass = Number(parts[offset + 3]);
      return { x, y, z, mass };
    })
    .filter((point) => [point.x, point.y, point.z, point.mass].every(Number.isFinite) && point.mass > 0);
}

function calculateCg(points) {
  const totalMass = points.reduce((sum, point) => sum + point.mass, 0);
  if (totalMass <= 0) return { x: NaN, y: NaN, z: NaN, totalMass: NaN };
  return {
    x: points.reduce((sum, point) => sum + point.x * point.mass, 0) / totalMass,
    y: points.reduce((sum, point) => sum + point.y * point.mass, 0) / totalMass,
    z: points.reduce((sum, point) => sum + point.z * point.mass, 0) / totalMass,
    totalMass,
  };
}

function ackermannPercent(innerDeg, outerDeg, trackM, wheelbaseM) {
  const inner = degToRad(Math.abs(innerDeg));
  const outer = degToRad(Math.abs(outerDeg));
  if (inner <= 0 || outer <= 0 || trackM <= 0 || wheelbaseM <= 0) return NaN;
  return ((1 / Math.tan(outer) - 1 / Math.tan(inner)) / (trackM / wheelbaseM)) * 100;
}

function measuredTurnRadius(innerDeg, outerDeg, trackM, wheelbaseM) {
  const inner = degToRad(Math.abs(innerDeg));
  const outer = degToRad(Math.abs(outerDeg));
  const radii = [];

  if (inner > 0 && wheelbaseM > 0) radii.push(wheelbaseM / Math.tan(inner) + trackM / 2);
  if (outer > 0 && wheelbaseM > 0) radii.push(wheelbaseM / Math.tan(outer) - trackM / 2);
  if (radii.length === 0) return NaN;
  return radii.reduce((sum, radius) => sum + radius, 0) / radii.length;
}

function drawGeometryDiagram({ fl, fr, rl, rr, cg, wheelbase, turnRadius }) {
  const canvas = document.querySelector("#geo-diagram");
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const points = [fl, fr, rl, rr].filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  if (points.length < 4 || !Number.isFinite(cg.x) || !Number.isFinite(cg.y)) return;

  const xs = [...points.map((point) => point.x), cg.x];
  const ys = [...points.map((point) => point.y), cg.y];
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const scale = Math.min((width - 160) / spanX, (height - 110) / spanY);
  const toCanvas = (point) => ({
    x: 80 + (point.x - minX) * scale,
    y: height - 60 - (point.y - minY) * scale,
  });
  const cfl = toCanvas(fl);
  const cfr = toCanvas(fr);
  const crl = toCanvas(rl);
  const crr = toCanvas(rr);
  const ccg = toCanvas(cg);

  context.strokeStyle = "#17202a";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(cfl.x, cfl.y);
  context.lineTo(cfr.x, cfr.y);
  context.lineTo(crr.x, crr.y);
  context.lineTo(crl.x, crl.y);
  context.closePath();
  context.stroke();

  context.fillStyle = "#f4f7fc";
  [cfl, cfr, crl, crr].forEach((point) => {
    context.beginPath();
    context.arc(point.x, point.y, 12, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  });

  context.fillStyle = "#c84c45";
  context.beginPath();
  context.arc(ccg.x, ccg.y, 8, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#c84c45";
  context.beginPath();
  context.moveTo(ccg.x - 18, ccg.y);
  context.lineTo(ccg.x + 18, ccg.y);
  context.moveTo(ccg.x, ccg.y - 18);
  context.lineTo(ccg.x, ccg.y + 18);
  context.stroke();

  context.fillStyle = "#17202a";
  context.font = "700 13px system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText("FL", cfl.x, cfl.y - 18);
  context.fillText("FR", cfr.x, cfr.y - 18);
  context.fillText("RL", crl.x, crl.y + 30);
  context.fillText("RR", crr.x, crr.y + 30);
  context.fillText("CG", ccg.x, ccg.y - 22);

  context.fillStyle = "#627080";
  context.font = "13px system-ui, sans-serif";
  context.fillText(`${format(wheelbase, 3, " m")} wheelbase`, width / 2, 24);
  context.fillText(`R ${format(turnRadius, 1, " m")} reference`, width / 2, height - 20);
}

function updateGeometry() {
  const form = document.querySelector('[data-form="geometry"]');
  const fl = point2d(form, "fl");
  const fr = point2d(form, "fr");
  const rl = point2d(form, "rl");
  const rr = point2d(form, "rr");
  const frontCenter = midpoint(fl, fr);
  const rearCenter = midpoint(rl, rr);
  const wheelbase = distance2d(frontCenter, rearCenter);
  const frontTrack = distance2d(fl, fr);
  const rearTrack = distance2d(rl, rr);
  const turnRadius = numberValue(form, "turnRadius");
  const speed = numberValue(form, "speedKph") / 3.6;
  const yawArm = numberValue(form, "yawArm");
  const massPoints = parseMassPoints(form.elements.massPoints.value);
  const cg = calculateCg(massPoints);
  const cgMeters = { x: cg.x / 1000, y: cg.y / 1000 };

  const yawRate = turnRadius > 0 ? speed / turnRadius : NaN;
  const lateralAccel = turnRadius > 0 ? speed ** 2 / turnRadius / 9.80665 : NaN;
  const corneringForce = Number.isFinite(cg.totalMass) && turnRadius > 0 ? (cg.totalMass * speed ** 2) / turnRadius : NaN;
  const yawTorque = Number.isFinite(corneringForce) ? corneringForce * yawArm : NaN;
  const displayRadius = turnRadius >= 30 ? 0 : turnRadius;

  document.querySelector("#geo-cg-x").textContent = format(cg.x, 1, " mm");
  document.querySelector("#geo-cg-y").textContent = format(cg.y, 1, " mm");
  document.querySelector("#geo-cg-z").textContent = format(cg.z, 1, " mm");
  document.querySelector("#geo-wheelbase").textContent = format(wheelbase, 3, " m");
  document.querySelector("#geo-track").textContent = `${format(frontTrack, 3, " m")} / ${format(rearTrack, 3, " m")}`;
  document.querySelector("#geo-mass").textContent = format(cg.totalMass, 1, " kg");
  document.querySelector("#geo-radius").textContent = format(displayRadius, 1, " m");
  document.querySelector("#geo-latacc").textContent = format(lateralAccel, 2, " g");
  document.querySelector("#geo-yaw-rate").textContent = format(yawRate, 3, " rad/s");
  document.querySelector("#geo-yaw-torque").textContent = format(yawTorque, 1, " Nm");

  const status = document.querySelector("#geo-status");
  status.className = "chain-status";
  if (massPoints.length === 0) {
    status.classList.add("risk");
    status.textContent = "질량점 형식을 확인하세요. 각 줄은 name, x, y, z, mass 또는 x, y, z, mass 형식입니다.";
  } else if (turnRadius <= 0) {
    status.classList.add("check");
    status.textContent = "회전반경을 입력하면 yaw rate와 lateral acceleration을 계산합니다.";
  } else {
    status.classList.add("good");
    status.textContent = `${massPoints.length}개 질량점으로 CG를 계산했습니다. 조향 관련 값은 Steering Setup 탭에서 따로 확인합니다.`;
  }

  drawGeometryDiagram({ fl, fr, rl, rr, cg: cgMeters, wheelbase, turnRadius });
}

function updateSteering() {
  const form = document.querySelector('[data-form="steering"]');
  const wheelbase = numberValue(form, "wheelbase");
  const frontTrack = numberValue(form, "frontTrack");
  const turnRadius = numberValue(form, "turnRadius");
  const direction = form.elements.turnDirection.value;
  const steeringWheelAngle = numberValue(form, "steeringWheelAngle");
  const rackTravel = numberValue(form, "rackTravel");
  const pinionRadius = numberValue(form, "pinionRadius");
  const steeringArm = numberValue(form, "steeringArm");
  const actualInnerAngle = numberValue(form, "actualInnerAngle");
  const actualOuterAngle = numberValue(form, "actualOuterAngle");

  const usableSteering = wheelbase > 0 && turnRadius > frontTrack / 2 && turnRadius > 0;
  const centerAngle = usableSteering ? Math.atan(wheelbase / turnRadius) : NaN;
  const innerAngle = usableSteering ? Math.atan(wheelbase / (turnRadius - frontTrack / 2)) : NaN;
  const outerAngle = usableSteering ? Math.atan(wheelbase / (turnRadius + frontTrack / 2)) : NaN;
  const idealInnerDeg = usableSteering ? Math.abs(signedDeg(innerAngle, direction)) : NaN;
  const idealOuterDeg = usableSteering ? Math.abs(signedDeg(outerAngle, direction)) : NaN;
  const measuredInnerDeg = actualInnerAngle > 0 ? actualInnerAngle : idealInnerDeg;
  const measuredOuterDeg = actualOuterAngle > 0 ? actualOuterAngle : idealOuterDeg;
  const averageRoadWheelAngle =
    measuredInnerDeg > 0 && measuredOuterDeg > 0 ? (measuredInnerDeg + measuredOuterDeg) / 2 : Math.abs(signedDeg(centerAngle, direction));
  const steeringRatio = averageRoadWheelAngle > 0 ? steeringWheelAngle / averageRoadWheelAngle : NaN;
  const ackermann = ackermannPercent(measuredInnerDeg, measuredOuterDeg, frontTrack, wheelbase);
  const measuredRadius = measuredTurnRadius(measuredInnerDeg, measuredOuterDeg, frontTrack, wheelbase);
  const radiusError = Number.isFinite(measuredRadius) ? measuredRadius - turnRadius : NaN;
  const rackPerSteeringDeg = steeringWheelAngle > 0 ? rackTravel / steeringWheelAngle : NaN;
  const pinionTravel = pinionRadius > 0 ? 2 * Math.PI * pinionRadius * (steeringWheelAngle / 360) : NaN;
  const rackSteer = steeringArm > 0 ? Math.atan(rackTravel / steeringArm) : NaN;

  document.querySelector("#steer-center-angle").textContent = format(signedDeg(centerAngle, direction), 2, " deg");
  document.querySelector("#steer-ideal-angles").textContent = `${format(signedDeg(innerAngle, direction), 2, " deg")} / ${format(
    signedDeg(outerAngle, direction),
    2,
    " deg",
  )}`;
  document.querySelector("#steer-ratio").textContent = format(steeringRatio, 2, ":1");
  document.querySelector("#steer-ackermann-percent").textContent = format(ackermann, 1, "%");
  document.querySelector("#steer-measured-radius").textContent = format(measuredRadius, 2, " m");
  document.querySelector("#steer-radius-error").textContent = format(radiusError, 2, " m");
  document.querySelector("#steer-rack-ratio").textContent = format(rackPerSteeringDeg, 3, " mm/deg");
  document.querySelector("#steer-pinion-travel").textContent = format(pinionTravel, 1, " mm");
  document.querySelector("#steer-rack-steer").textContent = format(signedDeg(rackSteer, direction), 2, " deg");

  const status = document.querySelector("#steer-status");
  status.className = "chain-status";
  if (!usableSteering) {
    status.classList.add("check");
    status.textContent = "Wheelbase, front track, target turn radius를 확인하세요. 회전반경은 track/2보다 커야 합니다.";
  } else if (!Number.isFinite(ackermann)) {
    status.classList.add("risk");
    status.textContent = "Measured inner/outer angle을 입력하면 Ackermann percent를 계산합니다.";
  } else {
    status.classList.add("good");
    status.textContent = `Steering ratio ${format(steeringRatio, 2, ":1")}, Ackermann ${format(
      ackermann,
      1,
      "%",
    )}, 목표 반경 대비 ${format(radiusError, 2, " m")}입니다.`;
  }
}

function pitchRadius(pitchMm, teeth) {
  return pitchMm / (2 * Math.sin(Math.PI / teeth));
}

function rawChainLinks(centerMm, pitchMm, smallTeeth, largeTeeth) {
  const centerPitches = centerMm / pitchMm;
  const averageTeeth = (smallTeeth + largeTeeth) / 2;
  const correction = (largeTeeth - smallTeeth) ** 2 / (4 * Math.PI ** 2 * centerPitches);
  return 2 * centerPitches + averageTeeth + correction;
}

function actualCenterDistance(links, pitchMm, smallTeeth, largeTeeth) {
  const averageTeeth = (smallTeeth + largeTeeth) / 2;
  const correction = (largeTeeth - smallTeeth) ** 2 / (4 * Math.PI ** 2);
  const usableLength = links - averageTeeth;
  const discriminant = usableLength ** 2 - 8 * correction;
  if (discriminant < 0) return NaN;
  return pitchMm * ((usableLength + Math.sqrt(discriminant)) / 4);
}

function wrapAngles(centerMm, pitchMm, smallTeeth, largeTeeth) {
  const smallRadius = pitchRadius(pitchMm, smallTeeth);
  const largeRadius = pitchRadius(pitchMm, largeTeeth);
  const ratio = Math.min(Math.max((largeRadius - smallRadius) / centerMm, -0.98), 0.98);
  const angleOffset = (2 * Math.asin(ratio) * 180) / Math.PI;
  return {
    small: 180 - angleOffset,
    large: 180 + angleOffset,
  };
}

function nearestEven(value) {
  const rounded = Math.round(value);
  return rounded % 2 === 0 ? rounded : rounded + 1;
}

function chainStatus(wrapDeg, centerErrorMm, adjustRangeMm, minWrapDeg) {
  if (wrapDeg < 90) {
    return { level: "risk", label: "Risk", text: "작은 스프로킷 감김각이 낮아서 점프/마모 리스크가 큽니다." };
  }
  if (wrapDeg < minWrapDeg || Math.abs(centerErrorMm) > adjustRangeMm) {
    return { level: "check", label: "Check", text: "감김각이나 액슬 조정 범위를 다시 확인하는 편이 좋습니다." };
  }
  return { level: "good", label: "Good", text: "감김각과 조정 범위가 입력 기준 안에 들어옵니다." };
}

function calculateChainOptions() {
  const form = document.querySelector('[data-form="chain"]');
  const chain = chainSizes[form.elements.chainSize.value] || chainSizes[420];
  const center = numberValue(form, "centerDistance");
  const motorTeeth = integerValue(form, "motorTeeth");
  const wheelTeeth = integerValue(form, "wheelTeeth");
  const adjustRange = numberValue(form, "adjustRange");
  const minWrap = numberValue(form, "minWrap");
  const smallTeeth = Math.min(motorTeeth, wheelTeeth);
  const largeTeeth = Math.max(motorTeeth, wheelTeeth);

  if (center <= 0 || smallTeeth < 8 || largeTeeth < 8) {
    return { chain, options: [], recommended: null, ratio: NaN, smallTeeth, largeTeeth };
  }

  const rawLinks = rawChainLinks(center, chain.pitchMm, smallTeeth, largeTeeth);
  const baseLinks = nearestEven(rawLinks);
  const linkCandidates = new Set();
  for (let offset = -8; offset <= 8; offset += 2) {
    const links = baseLinks + offset;
    if (links > smallTeeth + largeTeeth) linkCandidates.add(links);
  }

  const options = Array.from(linkCandidates)
    .sort((a, b) => a - b)
    .map((links) => {
      const actualCenter = actualCenterDistance(links, chain.pitchMm, smallTeeth, largeTeeth);
      const centerError = actualCenter - center;
      const wrap = wrapAngles(actualCenter, chain.pitchMm, smallTeeth, largeTeeth);
      const status = chainStatus(wrap.small, centerError, adjustRange, minWrap);
      return {
        links,
        actualCenter,
        centerError,
        wrapSmall: wrap.small,
        wrapLarge: wrap.large,
        status,
      };
    });

  const recommended = options.reduce((best, item) => {
    if (!best) return item;
    const itemScore = Math.abs(item.centerError) + (item.wrapSmall < minWrap ? 100 : 0);
    const bestScore = Math.abs(best.centerError) + (best.wrapSmall < minWrap ? 100 : 0);
    return itemScore < bestScore ? item : best;
  }, null);

  return {
    chain,
    options,
    recommended,
    ratio: wheelTeeth / motorTeeth,
    smallTeeth,
    largeTeeth,
  };
}

function drawChainDiagram(result) {
  const canvas = document.querySelector("#chain-diagram");
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  if (!result.recommended) return;

  const center = result.recommended.actualCenter;
  const smallRadius = pitchRadius(result.chain.pitchMm, result.smallTeeth);
  const largeRadius = pitchRadius(result.chain.pitchMm, result.largeTeeth);
  const scale = Math.min((width - 190) / (center + largeRadius * 2), (height - 72) / (largeRadius * 2.4));
  const smallR = smallRadius * scale;
  const largeR = largeRadius * scale;
  const leftX = 95 + largeR;
  const rightX = leftX + center * scale;
  const y = height / 2;
  const smallIsLeft = result.smallTeeth <= result.largeTeeth;
  const leftR = smallIsLeft ? smallR : largeR;
  const rightR = smallIsLeft ? largeR : smallR;

  context.strokeStyle = "#1f8a83";
  context.lineWidth = 16;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(leftX, y - leftR);
  context.lineTo(rightX, y - rightR);
  context.moveTo(leftX, y + leftR);
  context.lineTo(rightX, y + rightR);
  context.stroke();

  context.lineWidth = 2;
  context.strokeStyle = "#17202a";
  context.fillStyle = "#f4f7fc";
  context.beginPath();
  context.arc(leftX, y, leftR, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.beginPath();
  context.arc(rightX, y, rightR, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.fillStyle = "#17202a";
  context.font = "700 16px system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText(`${smallIsLeft ? result.smallTeeth : result.largeTeeth}T`, leftX, y + 5);
  context.fillText(`${smallIsLeft ? result.largeTeeth : result.smallTeeth}T`, rightX, y + 5);

  context.font = "13px system-ui, sans-serif";
  context.fillStyle = "#627080";
  context.fillText(`${format(center, 1, " mm")} center`, (leftX + rightX) / 2, height - 22);
  context.fillText(`${result.chain.pitchMm} mm pitch`, (leftX + rightX) / 2, 24);
}

function updateChain() {
  const result = calculateChainOptions();
  const recommended = result.recommended;
  const statusElement = document.querySelector("#chain-status");
  const optionsBody = document.querySelector("#chain-options");

  document.querySelector("#chain-links").textContent = recommended ? `${recommended.links} links` : "-";
  document.querySelector("#chain-wrap").textContent = recommended ? format(recommended.wrapSmall, 1, " deg") : "-";
  document.querySelector("#chain-ratio").textContent = format(result.ratio, 2, ":1");

  statusElement.className = "chain-status";
  if (recommended) {
    statusElement.classList.add(recommended.status.level);
    statusElement.textContent = `${recommended.status.label}: ${recommended.status.text} 실제 중심거리는 ${format(
      recommended.actualCenter,
      1,
      " mm",
    )}이고 목표 대비 ${format(recommended.centerError, 1, " mm")}입니다.`;
  } else {
    statusElement.textContent = "입력값을 확인하세요.";
  }

  optionsBody.innerHTML = result.options
    .map(
      (item) => `<tr>
        <td>${item.links}</td>
        <td>${format(item.actualCenter, 1, " mm")}</td>
        <td>${format(item.centerError, 1, " mm")}</td>
        <td>${format(item.wrapSmall, 1, " deg")}</td>
        <td>${item.status.label}</td>
      </tr>`,
    )
    .join("");
  drawChainDiagram(result);
}

function bytesToUint(bytes, start, byteCount) {
  let value = 0;
  for (let offset = 0; offset < byteCount; offset += 1) {
    value += bytes[start + offset] * 2 ** (offset * 8);
  }
  return value >>> 0;
}

function bytesToInt(bytes, start, byteCount) {
  const bitCount = byteCount * 8;
  const value = bytesToUint(bytes, start, byteCount);
  const signLimit = 2 ** (bitCount - 1);
  return value >= signLimit ? value - 2 ** bitCount : value;
}

function bytesToText(bytes, start, end) {
  const chars = Array.from(bytes.slice(start, end), (byte) => String.fromCharCode(byte)).join("");
  const nullIndex = chars.indexOf("\0");
  return nullIndex === -1 ? chars : chars.slice(0, nullIndex);
}

function monolithChecksumOk(record) {
  const expected = bytesToUint(record, 2, 2);
  let checksum = 0;

  for (let offset = 0; offset < monolithLog.size; offset += 4) {
    const chunk =
      (offset === 0 ? record[0] : record[offset]) +
      ((offset === 0 ? record[1] : record[offset + 1]) << 8) +
      ((offset === 0 ? 0 : record[offset + 2]) << 16) +
      ((offset === 0 ? 0 : record[offset + 3]) << 24);
    checksum ^= chunk >>> 0;
  }

  checksum = ((checksum & 0xffff) + (checksum >>> 16)) & 0xffff;
  return checksum === expected;
}

function parseMonolithRecord(record) {
  if (record.length < monolithLog.size || record[0] !== monolithLog.magic) return null;
  if (!monolithChecksumOk(record)) return null;

  const type = monolithLog.types[record[1]] || "INVALID";
  const base = {
    timestamp: bytesToUint(record, 4, 4),
    time_s: bytesToUint(record, 4, 4) / 1000,
    type,
  };

  if (type === "BOOT") {
    return {
      ...base,
      protocol_version: bytesToUint(record, 8, 1),
      mac: Array.from(record.slice(10, 16), (byte) => byte.toString(16).padStart(2, "0")).join(":").toUpperCase(),
    };
  }

  if (type === "CAN") {
    const len = bytesToUint(record, 14, 1);
    return {
      ...base,
      can_id: bytesToUint(record, 8, 4),
      can_extended: bytesToUint(record, 12, 1),
      can_remote: bytesToUint(record, 13, 1),
      can_len: len,
      can_data: Array.from(record.slice(16, 16 + len), (byte) => byte.toString(16).padStart(2, "0")).join(""),
    };
  }

  if (type === "GPS") {
    const latitudeRaw = bytesToUint(record, 8, 4) / 10000000;
    const longitudeRaw = bytesToUint(record, 12, 4) / 10000000;
    const latitude = Math.floor(latitudeRaw) + ((latitudeRaw % 1) * 100) / 60;
    const longitude = Math.floor(longitudeRaw) + ((longitudeRaw % 1) * 100) / 60;
    return {
      ...base,
      latitude: bytesToText(record, 16, 17) === "S" ? -latitude : latitude,
      longitude: bytesToText(record, 17, 18) === "W" ? -longitude : longitude,
      gps_speed: bytesToUint(record, 20, 2) / 100,
      gps_course: bytesToUint(record, 22, 2) / 100,
    };
  }

  if (type === "ANALOG") {
    return {
      ...base,
      ain1: bytesToInt(record, 8, 2),
      ain2: bytesToInt(record, 10, 2),
      ain3: bytesToInt(record, 12, 2),
      ain4: bytesToInt(record, 14, 2),
      ain5: bytesToInt(record, 16, 2),
      ain6: bytesToInt(record, 18, 2),
      voltage_raw: bytesToInt(record, 20, 2),
      temperature_raw: bytesToInt(record, 22, 2),
    };
  }

  if (type === "DIGITAL") {
    return {
      ...base,
      din1: bytesToUint(record, 8, 4),
      din2: bytesToUint(record, 12, 4),
      din3: bytesToUint(record, 16, 4),
      din4: bytesToUint(record, 20, 4),
    };
  }

  if (type === "GYROSCOPE") {
    return {
      ...base,
      accel_x: bytesToInt(record, 8, 2),
      accel_y: bytesToInt(record, 10, 2),
      accel_z: bytesToInt(record, 12, 2),
      gyro_temperature_raw: bytesToInt(record, 14, 2),
      gyro_x: bytesToInt(record, 16, 2),
      gyro_y: bytesToInt(record, 18, 2),
      gyro_z: bytesToInt(record, 20, 2),
    };
  }

  if (type === "SYSTEM" || type === "USER_EVENT") {
    return {
      ...base,
      message: bytesToText(record, 8, 24),
    };
  }

  return null;
}

function parseMonolithBinary(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < monolithLog.size || bytes[0] !== monolithLog.magic) return null;

  const rows = [];
  let validRecords = 0;

  for (let offset = 0; offset + monolithLog.size <= bytes.length; offset += monolithLog.size) {
    const record = parseMonolithRecord(bytes.slice(offset, offset + monolithLog.size));
    if (!record) return null;
    validRecords += 1;
    if (record.type !== "BOOT") rows.push(record);
  }

  return validRecords > 0 && rows.length > 0 ? rows : null;
}

function payloadHex(bytes, offset) {
  return Array.from(bytes.slice(offset, offset + 8), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function gBungeUint(view, offset, byteCount) {
  if (byteCount === 1) return view.getUint8(offset);
  if (byteCount === 2) return view.getUint16(offset, true);
  return view.getUint32(offset, true);
}

function gBungeInt(view, offset, byteCount) {
  if (byteCount === 1) return view.getInt8(offset);
  if (byteCount === 2) return view.getInt16(offset, true);
  return view.getInt32(offset, true);
}

function parseGbungERecord(bytes, offset) {
  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 16);
  const timestampMs = view.getUint32(0, true);
  const level = view.getUint8(4);
  const source = view.getUint8(5);
  const key = view.getUint8(6);
  const checksum = view.getUint8(7);
  const base = {
    timestamp_ms: timestampMs,
    time_s: timestampMs / 1000,
    level,
    source,
    key,
    checksum,
  };

  if (source === 0) return { ...base, type: "SYS", payload: payloadHex(bytes, offset + 8) };

  if (source === 1) {
    if (key === 10) {
      return {
        ...base,
        type: "CAN_0A",
        torque_actual_nm: gBungeInt(view, 8, 2) / 16,
        current_actual: gBungeInt(view, 10, 2),
        velocity: gBungeInt(view, 12, 4),
      };
    }
    if (key === 11) {
      return {
        ...base,
        type: "CAN_0B",
        ud: gBungeInt(view, 8, 2) / 16,
        uq: gBungeInt(view, 10, 2) / 16,
        vmod: (100 / 256) * gBungeUint(view, 12, 2),
        vcap: gBungeUint(view, 14, 2) / 16,
      };
    }
    if (key === 12) {
      return {
        ...base,
        type: "CAN_0C",
        inductance_raw: gBungeUint(view, 8, 2),
        voltage_limit: gBungeInt(view, 10, 2),
        iflux: gBungeInt(view, 12, 2),
        iqmax: gBungeInt(view, 14, 2),
      };
    }
    if (key === 13) {
      return {
        ...base,
        type: "CAN_0D",
        motor_temp_c: gBungeInt(view, 8, 2),
        battery_current_a: gBungeInt(view, 10, 2) / 16,
        torque_demand_nm: gBungeInt(view, 12, 2) / 16,
        torque_actual_nm: gBungeInt(view, 14, 2) / 16,
      };
    }
    if (key === 14) {
      return {
        ...base,
        type: "CAN_0E",
        voltage_target: gBungeInt(view, 8, 4),
        id_a: gBungeInt(view, 12, 2) / 16,
        iq_a: gBungeInt(view, 14, 2) / 16,
      };
    }
    return { ...base, type: "CAN", payload: payloadHex(bytes, offset + 8) };
  }

  if (source === 2) return { ...base, type: "DIGITAL", payload: payloadHex(bytes, offset + 8) };
  if (source === 3) return { ...base, type: "ANALOG", payload: payloadHex(bytes, offset + 8) };
  if (source === 4) return { ...base, type: "PULSE", payload: payloadHex(bytes, offset + 8) };

  if (source === 5) {
    return {
      ...base,
      type: "ACCELEROMETER",
      accel_x_g: gBungeInt(view, 8, 2) * (4 / 512),
      accel_y_g: gBungeInt(view, 10, 2) * (4 / 512),
      accel_z_g: gBungeInt(view, 12, 2) * (4 / 512),
    };
  }

  if (source === 6) {
    if (key === 0) {
      return {
        ...base,
        type: "GPS_POS",
        latitude: gBungeInt(view, 8, 4) / 10000000,
        longitude: gBungeInt(view, 12, 4) / 10000000,
      };
    }
    if (key === 1) {
      return {
        ...base,
        type: "GPS_VEC",
        speed_kph: gBungeInt(view, 8, 4),
        course_deg: gBungeInt(view, 12, 4),
      };
    }
    return { ...base, type: "GPS", payload: payloadHex(bytes, offset + 8) };
  }

  return null;
}

function parseGbungEBinary(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 16 || bytes.length % 16 !== 0) return null;

  const rows = [];
  let plausible = 0;

  for (let offset = 0; offset + 16 <= bytes.length; offset += 16) {
    const source = bytes[offset + 5];
    const key = bytes[offset + 6];
    const timestamp = bytesToUint(bytes, offset, 4);

    if (source <= 6 && timestamp < 24 * 60 * 60 * 1000) {
      const row = parseGbungERecord(bytes, offset);
      if (row) {
        plausible += 1;
        rows.push(row);
      }
    }
  }

  return plausible / (bytes.length / 16) > 0.85 && rows.length > 0 ? rows : null;
}

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }

  cells.push(cell.trim());
  return cells;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2 || !lines[0].includes(",")) return null;

  const headers = parseCsvLine(lines[0]).map((header, index) => header || `col_${index + 1}`);
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });

  return rows.length > 0 ? rows : null;
}

function flattenRecord(record, prefix = "") {
  const output = {};

  Object.entries(record || {}).forEach(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(output, flattenRecord(value, nextKey));
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item && typeof item === "object") {
          Object.assign(output, flattenRecord(item, `${nextKey}.${index}`));
        } else {
          output[`${nextKey}.${index}`] = item;
        }
      });
    } else {
      output[nextKey] = value;
    }
  });

  return output;
}

function parseJson(text) {
  try {
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed) ? parsed : parsed?.data || parsed?.rows || parsed?.records || parsed?.logs;
    if (!Array.isArray(rows)) return null;
    return rows.map((row) => (row && typeof row === "object" ? flattenRecord(row) : { value: row }));
  } catch {
    return null;
  }
}

function parseJsonLines(text) {
  const rows = [];
  const lines = text.split(/\r?\n/).filter((line) => line.trim().startsWith("{"));

  for (const line of lines) {
    try {
      rows.push(flattenRecord(JSON.parse(line)));
    } catch {
      return null;
    }
  }

  return rows.length > 0 ? rows : null;
}

function parseNumericText(text) {
  const rows = [];
  const splitPattern = /[\s,;]+/;

  text.split(/\r?\n/).forEach((line) => {
    const values = line
      .trim()
      .split(splitPattern)
      .map(Number)
      .filter(Number.isFinite);
    if (values.length > 0) {
      rows.push(Object.fromEntries(values.map((value, index) => [`value_${index + 1}`, value])));
    }
  });

  return rows.length > 0 ? rows : null;
}

function parseUploadedData(text) {
  return parseJson(text) || parseJsonLines(text) || parseCsv(text) || parseNumericText(text) || [];
}

function normalizeRows(rows) {
  return rows.map((row, index) => ({ sample: index, ...row }));
}

function getColumns(rows) {
  const columns = new Set();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => columns.add(key));
  });
  return Array.from(columns);
}

function numericValue(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value !== "string") return NaN;
  const normalized = value.trim().replace(/[^\d.+\-eE]/g, "");
  if (!normalized) return NaN;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : NaN;
}

function getNumericColumns(rows, columns) {
  return columns.filter((column) => rows.some((row) => Number.isFinite(numericValue(row[column]))));
}

function preferredColumn(columns, patterns, fallback) {
  return columns.find((column) => patterns.some((pattern) => pattern.test(column))) || fallback;
}

function fillSelect(select, options, selected) {
  select.innerHTML = options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join("");
  select.value = options.includes(selected) ? selected : options[0] || "";
  select.disabled = options.length === 0;
}

function setAnalysisStatus(text, level = "") {
  const status = document.querySelector("#analysis-status");
  status.className = "chain-status";
  if (level) status.classList.add(level);
  status.textContent = text;
}

function summarizeDuration(rows, xColumn) {
  if (!xColumn) return "-";
  const values = rows.map((row) => numericValue(row[xColumn])).filter(Number.isFinite);
  if (values.length < 2) return "-";
  const duration = Math.max(...values) - Math.min(...values);
  return format(duration, 2, xColumn.toLowerCase().includes("time") ? " s" : "");
}

function updateAnalysisMetrics() {
  document.querySelector("#analysis-samples").textContent = analysisState.rows.length || "-";
  document.querySelector("#analysis-signals").textContent = analysisState.numericColumns.length || "-";
  document.querySelector("#analysis-duration").textContent = summarizeDuration(
    analysisState.rows,
    document.querySelector("#analysis-x-axis").value,
  );
}

function drawEmptyAnalysisChart(message = "Load a log file") {
  const canvas = document.querySelector("#analysis-chart");
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#627080";
  context.font = "700 18px system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText(message, canvas.width / 2, canvas.height / 2);
}

function drawAnalysisChart() {
  const xColumn = document.querySelector("#analysis-x-axis").value;
  const yColumn = document.querySelector("#analysis-y-axis").value;
  const canvas = document.querySelector("#analysis-chart");
  const context = canvas.getContext("2d");
  const points = analysisState.rows
    .map((row, index) => ({
      x: xColumn === "sample" ? index : numericValue(row[xColumn]),
      y: numericValue(row[yColumn]),
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (points.length < 2) {
    drawEmptyAnalysisChart("Not enough numeric data");
    return;
  }

  const padding = { top: 28, right: 28, bottom: 52, left: 72 };
  const plotWidth = canvas.width - padding.left - padding.right;
  const plotHeight = canvas.height - padding.top - padding.bottom;
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const toX = (value) => padding.left + ((value - minX) / spanX) * plotWidth;
  const toY = (value) => padding.top + plotHeight - ((value - minY) / spanY) * plotHeight;

  context.strokeStyle = "#d7dde3";
  context.lineWidth = 1;
  context.beginPath();
  for (let tick = 0; tick <= 4; tick += 1) {
    const x = padding.left + (plotWidth * tick) / 4;
    const y = padding.top + (plotHeight * tick) / 4;
    context.moveTo(x, padding.top);
    context.lineTo(x, padding.top + plotHeight);
    context.moveTo(padding.left, y);
    context.lineTo(padding.left + plotWidth, y);
  }
  context.stroke();

  context.strokeStyle = "#17202a";
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(padding.left, padding.top);
  context.lineTo(padding.left, padding.top + plotHeight);
  context.lineTo(padding.left + plotWidth, padding.top + plotHeight);
  context.stroke();

  context.strokeStyle = "#1f8a83";
  context.lineWidth = 3;
  context.beginPath();
  points.forEach((point, index) => {
    const x = toX(point.x);
    const y = toY(point.y);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();

  context.fillStyle = "#17202a";
  context.font = "13px system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText(xColumn, padding.left + plotWidth / 2, canvas.height - 16);
  context.save();
  context.translate(18, padding.top + plotHeight / 2);
  context.rotate(-Math.PI / 2);
  context.fillText(yColumn, 0, 0);
  context.restore();

  context.textAlign = "right";
  context.fillStyle = "#627080";
  context.fillText(compactNumber(maxY), padding.left - 10, padding.top + 5);
  context.fillText(compactNumber(minY), padding.left - 10, padding.top + plotHeight + 4);
  context.textAlign = "center";
  context.fillText(compactNumber(minX), padding.left, padding.top + plotHeight + 24);
  context.fillText(compactNumber(maxX), padding.left + plotWidth, padding.top + plotHeight + 24);

  document.querySelector("#analysis-chart-label").textContent = `${yColumn} vs ${xColumn}`;
}

function renderAnalysisTable() {
  const table = document.querySelector("#analysis-table");
  const columns = analysisState.columns.slice(0, 12);
  const rows = analysisState.rows.slice(0, 120);

  table.querySelector("thead").innerHTML = columns.length
    ? `<tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>`
    : "";
  table.querySelector("tbody").innerHTML = rows
    .map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column] ?? "")}</td>`).join("")}</tr>`)
    .join("");

  document.querySelector("#analysis-table-label").textContent = `${rows.length} / ${analysisState.rows.length} samples`;
}

function renderAnalysis() {
  const xSelect = document.querySelector("#analysis-x-axis");
  const ySelect = document.querySelector("#analysis-y-axis");
  const xFallback = preferredColumn(analysisState.numericColumns, [/^time/i, /time/i, /timestamp/i], "sample");
  const yFallback = preferredColumn(analysisState.numericColumns, [/speed/i, /accel/i, /rpm/i, /pressure/i], analysisState.numericColumns[0]);

  fillSelect(xSelect, ["sample", ...analysisState.numericColumns.filter((column) => column !== "sample")], xSelect.value || xFallback);
  fillSelect(ySelect, analysisState.numericColumns.filter((column) => column !== "sample"), ySelect.value || yFallback);
  updateAnalysisMetrics();
  renderAnalysisTable();
  drawAnalysisChart();
}

async function handleAnalysisFile(file) {
  if (!file) return;

  try {
    let parsedRows = null;

    if (typeof file.arrayBuffer === "function") {
      const bytes = new Uint8Array(await file.arrayBuffer());
      parsedRows = parseMonolithBinary(bytes) || parseGbungEBinary(bytes);
    }

    if (!parsedRows && typeof file.text === "function") {
      parsedRows = parseUploadedData(await file.text());
    }

    const rows = normalizeRows(parsedRows || []);
    const columns = getColumns(rows);
    const numericColumns = getNumericColumns(rows, columns);

    analysisState.rows = rows;
    analysisState.columns = columns;
    analysisState.numericColumns = numericColumns;
    analysisState.fileName = file.name;

    if (rows.length === 0 || numericColumns.length === 0) {
      setAnalysisStatus("숫자형 데이터를 찾지 못했습니다. CSV, JSON, 줄 단위 JSON, 숫자 텍스트 로그를 지원합니다.", "risk");
      drawEmptyAnalysisChart("No numeric data");
      renderAnalysisTable();
      updateAnalysisMetrics();
      return;
    }

    setAnalysisStatus(`${file.name} 로드 완료: ${rows.length} samples, ${numericColumns.length} numeric signals`, "good");
    renderAnalysis();
  } catch (error) {
    setAnalysisStatus(`파일을 읽지 못했습니다: ${error.message}`, "risk");
    drawEmptyAnalysisChart("Read failed");
  }
}

function initAnalysisViewer() {
  const fileInput = document.querySelector("#monolith-file");
  const xSelect = document.querySelector("#analysis-x-axis");
  const ySelect = document.querySelector("#analysis-y-axis");

  fileInput.addEventListener("change", (event) => {
    handleAnalysisFile(event.currentTarget.files[0]);
  });
  xSelect.addEventListener("change", () => {
    updateAnalysisMetrics();
    drawAnalysisChart();
  });
  ySelect.addEventListener("change", drawAnalysisChart);

  fillSelect(xSelect, [], "");
  fillSelect(ySelect, [], "");
  drawEmptyAnalysisChart();
}

function updateAll() {
  updateBrake();
  updateSpring();
  updateMotion();
  updateGeometry();
  updateSteering();
  updateChain();
}

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => {
    activateView(button.dataset.view);
  });
});

document.querySelectorAll(".calc-tab").forEach((button) => {
  button.addEventListener("click", () => {
    activateCalc(button.dataset.calc);
  });
});

document.querySelector("#reset-tool").addEventListener("click", (event) => {
  resetForm(event.currentTarget.dataset.calc || activeCalc);
});

document.querySelectorAll("input, select, textarea").forEach((field) => {
  field.addEventListener("input", updateAll);
  field.addEventListener("change", updateAll);
});

saveDefaults();
activateCalc("brake");
activateView("intro");
initAnalysisViewer();
updateAll();
