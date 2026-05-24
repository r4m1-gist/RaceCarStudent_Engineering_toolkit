const toolTitles = {
  brake: "Brake Bias",
  spring: "Spring Rate",
  motion: "Motion Ratio",
  chain: "Chain Drive",
};

const chainSizes = {
  420: { pitchMm: 12.7, rollerWidthMm: 6.35 },
  428: { pitchMm: 12.7, rollerWidthMm: 7.75 },
  520: { pitchMm: 15.875, rollerWidthMm: 6.35 },
};

const defaults = new Map();

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

function activateTool(tool) {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === tool);
  });
  document.querySelectorAll(".tool-section").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tool);
  });
  document.querySelector("#tool-title").textContent = toolTitles[tool];
  document.querySelector("#reset-tool").dataset.tool = tool;
}

function updateBrake() {
  const form = document.querySelector('[data-form="brake"]');
  const front =
    numberValue(form, "frontArea") *
    numberValue(form, "frontRadius") *
    numberValue(form, "frontMu") *
    numberValue(form, "frontPressure");
  const rear =
    numberValue(form, "rearArea") *
    numberValue(form, "rearRadius") *
    numberValue(form, "rearMu") *
    numberValue(form, "rearPressure");
  const total = front + rear;
  const frontPercent = total > 0 ? (front / total) * 100 : 0;
  const rearPercent = total > 0 ? (rear / total) * 100 : 0;

  document.querySelector("#brake-front").textContent = format(frontPercent, 1, "%");
  document.querySelector("#brake-rear").textContent = format(rearPercent, 1, "%");
  document.querySelector("#brake-front-factor").textContent = format(front, 0);
  document.querySelector("#brake-rear-factor").textContent = format(rear, 0);
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

function updateAll() {
  updateBrake();
  updateSpring();
  updateMotion();
  updateChain();
}

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => {
    activateTool(button.dataset.tool);
  });
});

document.querySelector("#reset-tool").addEventListener("click", (event) => {
  resetForm(event.currentTarget.dataset.tool || "brake");
});

document.querySelectorAll("input, select, textarea").forEach((field) => {
  field.addEventListener("input", updateAll);
  field.addEventListener("change", updateAll);
});

saveDefaults();
activateTool("brake");
updateAll();
