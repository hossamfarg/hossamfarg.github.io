import { PALETTE } from "./levels.js";
const HIEROGLYPHS = ["𓂀", "𓋹", "𓆣", "𓇳", "𓏏", "𓊽"];

export class RoyalRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  getSerpentinePoint(dist, width, stationH) {
    const leftX = 90;
    const rightX = width - 38;
    const topY = stationH * 0.30;
    const botY = stationH * 0.76;
    const radius = (botY - topY) / 2;
    const centerY = (topY + botY) / 2;

    const bottomStraightLen = rightX - leftX;
    const arcLen = Math.PI * radius;

    if (dist <= bottomStraightLen) {
      return { x: leftX + dist, y: botY };
    } else if (dist <= bottomStraightLen + arcLen) {
      const u = (dist - bottomStraightLen) / arcLen;
      const angle = (Math.PI / 2) - u * Math.PI;
      return { x: rightX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius };
    } else {
      const rem = dist - bottomStraightLen - arcLen;
      return { x: Math.max(24, rightX - rem), y: topY };
    }
  }

  renderStation(game) {
    const { ctx } = this;
    const { width, stationH, queue, queueOffset, pulsePhase } = game;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, stationH);
    bgGrad.addColorStop(0, "#161026"); bgGrad.addColorStop(1, "#0f0b1a");
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, width, stationH);

    const leftX = 90;
    const rightX = width - 38;
    const topY = stationH * 0.30;
    const botY = stationH * 0.76;
    const radius = (botY - topY) / 2;
    const centerY = (topY + botY) / 2;

    ctx.save();
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(24, topY);
    ctx.lineTo(rightX, topY);
    ctx.arc(rightX, centerY, radius, -Math.PI / 2, Math.PI / 2, false);
    ctx.lineTo(leftX, botY);
    ctx.strokeStyle = "rgba(245, 196, 61, 0.42)"; ctx.lineWidth = 32; ctx.stroke();

    ctx.strokeStyle = "#261b3d"; ctx.lineWidth = 26; ctx.stroke();

    ctx.strokeStyle = "rgba(255, 232, 133, 0.14)"; ctx.lineWidth = 2;
    ctx.setLineDash([6, 14]); ctx.lineDashOffset = pulsePhase * 8; ctx.stroke();
    ctx.restore();

    const gateGrad = ctx.createLinearGradient(10, botY - 16, 78, botY + 16);
    gateGrad.addColorStop(0, "#ffe885"); gateGrad.addColorStop(0.5, "#f5c43d"); gateGrad.addColorStop(1, "#9e6d10");
    ctx.fillStyle = gateGrad;
    this.roundRect(10, botY - 15, 68, 30, 8, true, false);

    ctx.fillStyle = "#140d21"; ctx.font = "900 10px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("GATE ▶", 44, botY);

    ctx.fillStyle = "rgba(255, 232, 133, 0.65)"; ctx.font = "800 9.5px sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`ROYAL QUEUE: ${queue.length}`, 12, topY);

    const spacing = 25;
    const visible = Math.min(queue.length, 25);
    for (let i = visible - 1; i >= 0; i--) {
      const pal = PALETTE[queue[i]] || PALETTE.Ruby;
      const dist = (i + queueOffset) * spacing;
      const pt = this.getSerpentinePoint(dist, width, stationH);
      const isFront = i === 0;
      const r = isFront ? 13.8 : 11.5;

      if (isFront) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r + 4.5 + Math.sin(pulsePhase * 2.5) * 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 232, 133, 0.36)"; ctx.fill();
        ctx.restore();
      }

      ctx.beginPath(); ctx.arc(pt.x, pt.y + 3, r, 0, Math.PI * 2); ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; ctx.fill();

      const pGrad = ctx.createRadialGradient(pt.x - r * 0.35, pt.y - r * 0.35, 1.5, pt.x, pt.y, r);
      pGrad.addColorStop(0, "#ffffff"); pGrad.addColorStop(0.22, pal.hi); pGrad.addColorStop(0.7, pal.primary); pGrad.addColorStop(1, pal.dark);
      ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2); ctx.fillStyle = pGrad; ctx.fill();

      ctx.strokeStyle = isFront ? "#ffe885" : "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = isFront ? 2.4 : 1.3; ctx.stroke();

      ctx.fillStyle = "#ffffff"; ctx.font = `900 ${isFront ? 12 : 10}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(pal.symbol, pt.x, pt.y + 0.5);
    }
  }

  renderDock(game, tempo) {
    const { ctx } = this;
    const { width, stationH, dockH, dock, dockSlots, maxDockSlots } = game;
    const startY = stationH;

    ctx.fillStyle = "#0e0a18"; ctx.fillRect(0, startY, width, dockH);
    ctx.fillStyle = "rgba(249, 241, 222, 0.6)"; ctx.font = "800 9.5px sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`ROYAL HOLDING BAYS (${dock.length}/${dockSlots})   •   MAQAM TEMPO: ${Math.round(tempo)} BPM`, 14, startY + 11);

    const slotW = (width - 24) / maxDockSlots;
    const slotH = dockH - 22;
    for (let i = 0; i < maxDockSlots; i++) {
      const sx = 12 + i * slotW; const sy = startY + 18;
      if (i < dockSlots) {
        const isDangerSlot = i === dockSlots - 1 && dock.length >= dockSlots - 1;
        ctx.fillStyle = "#191329";
        ctx.strokeStyle = isDangerSlot ? "#ff4757" : "rgba(245, 196, 61, 0.32)";
        ctx.lineWidth = 1.5;
        this.roundRect(sx + 3, sy, slotW - 6, slotH, 9, true, true);
        const car = dock[i];
        if (car) this.drawDockedChariot(car, sx + 5, sy + 2, slotW - 10, slotH - 4);
        else {
          ctx.fillStyle = "rgba(255, 232, 133, 0.08)"; ctx.font = "900 10px sans-serif"; ctx.textAlign = "center";
          ctx.fillText("BAY", sx + slotW / 2, sy + slotH / 2);
        }
      } else {
        ctx.fillStyle = "#120d1d"; ctx.strokeStyle = "#251c38";
        this.roundRect(sx + 3, sy, slotW - 6, slotH, 9, true, true);
        ctx.fillStyle = "#6e5f8a"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("🔒", sx + slotW / 2, sy + slotH / 2);
      }
    }
  }

  drawDockedChariot(car, x, y, w, h) {
    const { ctx } = this;
    const pal = PALETTE[car.color] || PALETTE.Ruby;
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, pal.hi); grad.addColorStop(0.5, pal.primary); grad.addColorStop(1, pal.dark);
    ctx.fillStyle = grad; ctx.strokeStyle = "#ffe885"; ctx.lineWidth = 1.6;
    this.roundRect(x, y, w, h, 7, true, true);

    ctx.fillStyle = "#fff"; ctx.font = "900 11px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`${pal.symbol} ${car.occupancy}/${car.cap}`, x + w / 2, y + 13);

    const cols = Math.ceil(car.cap / 2);
    const padX = 7; const availW = w - padX * 2;
    for (let s = 0; s < car.cap; s++) {
      const row = s % 2; const col = Math.floor(s / 2);
      const cx = x + padX + (cols > 1 ? (col * availW) / (cols - 1) : availW / 2);
      const cy = y + h - 17 + row * 9;
      ctx.beginPath(); ctx.arc(cx, cy, 3.3, 0, Math.PI * 2);
      ctx.fillStyle = s < car.occupancy ? "#ffe885" : "rgba(0, 0, 0, 0.55)"; ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.65)"; ctx.lineWidth = 0.8; ctx.stroke();
    }
  }

  renderYard(game) {
    const { ctx } = this;
    const { yardX, yardY, cellSize, gridCols, gridRows, carriages, departingCarriages } = game;
    const boardW = cellSize * gridCols; const boardH = cellSize * gridRows;

    ctx.fillStyle = "#0b0813";
    this.roundRect(yardX - 9, yardY - 9, boardW + 18, boardH + 18, 15, true, false);
    ctx.strokeStyle = "rgba(245, 196, 61, 0.45)"; ctx.lineWidth = 2;
    this.roundRect(yardX - 9, yardY - 9, boardW + 18, boardH + 18, 15, false, true);

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const tx = yardX + c * cellSize; const ty = yardY + r * cellSize;
        const tileGrad = ctx.createLinearGradient(tx, ty, tx + cellSize, ty + cellSize);
        if ((r + c) % 2 === 0) { tileGrad.addColorStop(0, "#1c162b"); tileGrad.addColorStop(1, "#161122"); }
        else { tileGrad.addColorStop(0, "#211a33"); tileGrad.addColorStop(1, "#191327"); }
        ctx.fillStyle = tileGrad; ctx.fillRect(tx + 1, ty + 1, cellSize - 2, cellSize - 2);

        ctx.strokeStyle = "rgba(255, 232, 133, 0.04)"; ctx.lineWidth = 1; ctx.strokeRect(tx + 3, ty + 3, cellSize - 6, cellSize - 6);

        ctx.fillStyle = "rgba(255, 232, 133, 0.035)"; ctx.font = "14px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(HIEROGLYPHS[(r * 3 + c) % HIEROGLYPHS.length], tx + cellSize / 2, ty + cellSize / 2);
      }
    }

    carriages.forEach(car => {
      const isH = car.dir === "LEFT" || car.dir === "RIGHT";
      const px = yardX + car.c * cellSize + (isH && car.bumpOffset ? car.bumpOffset : 0);
      const py = yardY + car.r * cellSize + (!isH && car.bumpOffset ? car.bumpOffset : 0);
      this.drawRoyalChariot(car, px, py, cellSize, game.getBlockingCarriage(car) === null, game.pulsePhase);
    });

    departingCarriages.forEach(d => {
      this.drawRoyalChariot(d.car, d.px, d.py, cellSize, true, game.pulsePhase);
    });
  }

  drawRoyalChariot(car, px, py, cellSize, isFree, pulsePhase) {
    const { ctx } = this;
    const pal = PALETTE[car.color] || PALETTE.Ruby;
    const isH = car.dir === "LEFT" || car.dir === "RIGHT";
    const margin = 4.5;
    const x = px + margin; const y = py + margin;
    const w = (isH ? car.length * cellSize : cellSize) - margin * 2;
    const h = (isH ? cellSize : car.length * cellSize) - margin * 2;

    ctx.save();
    if (isFree) this.drawHeadlampCones(x, y, w, h, car.dir);

    ctx.fillStyle = "#e0a82e"; ctx.strokeStyle = "#120c1c"; ctx.lineWidth = 1.3;
    const wheelCount = car.length;
    for (let i = 0; i < wheelCount; i++) {
      if (isH) {
        const wx = x + 10 + i * ((w - 30) / Math.max(1, wheelCount - 1));
        this.roundRect(wx, y - 3, 11, 4.5, 2, true, true);
        this.roundRect(wx, y + h - 1.5, 11, 4.5, 2, true, true);
      } else {
        const wy = y + 10 + i * ((h - 30) / Math.max(1, wheelCount - 1));
        this.roundRect(x - 3, wy, 4.5, 11, 2, true, true);
        this.roundRect(x + w - 1.5, wy, 4.5, 11, 2, true, true);
      }
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.65)"; this.roundRect(x + 2, y + 6, w, h, 12, true, false);
    ctx.fillStyle = pal.dark; this.roundRect(x, y + 3.5, w, h, 10, true, false);

    const bodyGrad = isH ? ctx.createLinearGradient(x, y, x, y + h) : ctx.createLinearGradient(x, y, x + w, y);
    bodyGrad.addColorStop(0, pal.hi); bodyGrad.addColorStop(0.45, pal.primary); bodyGrad.addColorStop(1, pal.dark);
    ctx.fillStyle = bodyGrad; ctx.strokeStyle = isFree ? "#ffe885" : "rgba(255, 255, 255, 0.42)"; ctx.lineWidth = isFree ? 2.2 : 1.2;
    this.roundRect(x, y, w, h - 2, 10, true, true);

    ctx.fillStyle = "rgba(255, 255, 255, 0.16)"; this.roundRect(x + 3, y + 2, w - 6, (h - 4) * 0.32, 7, true, false);

    if (car.flashTimer && car.flashTimer > 0) {
      car.flashTimer = Math.max(0, car.flashTimer - 0.08);
      ctx.fillStyle = `rgba(255, 71, 87, ${car.flashTimer * 0.6})`;
      this.roundRect(x, y, w, h - 2, 10, true, false);
    }

    const inset = 6.5;
    ctx.fillStyle = "rgba(10, 7, 16, 0.46)"; ctx.strokeStyle = pal.trim; ctx.lineWidth = 1.0;
    this.roundRect(x + inset, y + inset, w - inset * 2, h - inset * 2 - 2, 6, true, true);

    const pairs = car.cap / 2;
    for (let p = 0; p < pairs; p++) {
      const ratio = pairs > 1 ? p / (pairs - 1) : 0.5;
      if (isH) {
        const sx = x + inset + 8 + ratio * (w - inset * 2 - 16);
        this.drawSeatCushion(sx, y + inset + 5, pal.trim);
        this.drawSeatCushion(sx, y + h - inset - 7, pal.trim);
      } else {
        const sy = y + inset + 8 + ratio * (h - inset * 2 - 16);
        this.drawSeatCushion(x + inset + 5, sy, pal.trim);
        this.drawSeatCushion(x + w - inset - 7, sy, pal.trim);
      }
    }

    ctx.fillStyle = "#fff6b3";
    if (car.dir === "UP") { ctx.fillRect(x + 6, y + 1, 7, 3); ctx.fillRect(x + w - 13, y + 1, 7, 3); }
    else if (car.dir === "DOWN") { ctx.fillRect(x + 6, y + h - 5, 7, 3); ctx.fillRect(x + w - 13, y + h - 5, 7, 3); }
    else if (car.dir === "LEFT") { ctx.fillRect(x + 1, y + 6, 3, 7); ctx.fillRect(x + 1, y + h - 15, 3, 7); }
    else if (car.dir === "RIGHT") { ctx.fillRect(x + w - 4, y + 6, 3, 7); ctx.fillRect(x + w - 4, y + h - 15, 3, 7); }

    const cx = x + w / 2; const cy = y + (h - 2) / 2;
    ctx.beginPath(); ctx.arc(cx, cy, 12.5, 0, Math.PI * 2); ctx.fillStyle = "rgba(15, 11, 24, 0.82)"; ctx.fill();
    ctx.strokeStyle = isFree ? "#ffe885" : pal.trim; ctx.lineWidth = 1.4; ctx.stroke();

    const nudge = isFree ? Math.sin(pulsePhase * 2.4) * 2.4 : 0;
    const ax = cx + (car.dir === "LEFT" ? -nudge : (car.dir === "RIGHT" ? nudge : 0));
    const ay = cy + (car.dir === "UP"   ? -nudge : (car.dir === "DOWN"  ? nudge : 0));

    ctx.fillStyle = isFree ? "#ffe885" : "#ffffff"; ctx.font = "900 13px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const arrow = car.dir === "DOWN" ? "▼" : (car.dir === "LEFT" ? "◀" : (car.dir === "RIGHT" ? "▶" : "▲"));
    ctx.fillText(arrow, ax, ay);
    ctx.restore();
  }

  drawHeadlampCones(x, y, w, h, dir) {
    const { ctx } = this; ctx.save(); const len = 16; let grad;
    if (dir === "UP") {
      grad = ctx.createLinearGradient(x, y, x, y - len);
      grad.addColorStop(0, "rgba(255, 232, 133, 0.35)"); grad.addColorStop(1, "rgba(255, 232, 133, 0)");
      ctx.fillStyle = grad; ctx.fillRect(x + 4, y - len, w - 8, len);
    } else if (dir === "DOWN") {
      grad = ctx.createLinearGradient(x, y + h, x, y + h + len);
      grad.addColorStop(0, "rgba(255, 232, 133, 0.35)"); grad.addColorStop(1, "rgba(255, 232, 133, 0)");
      ctx.fillStyle = grad; ctx.fillRect(x + 4, y + h, w - 8, len);
    } else if (dir === "LEFT") {
      grad = ctx.createLinearGradient(x, y, x - len, y);
      grad.addColorStop(0, "rgba(255, 232, 133, 0.35)"); grad.addColorStop(1, "rgba(255, 232, 133, 0)");
      ctx.fillStyle = grad; ctx.fillRect(x - len, y + 4, len, h - 8);
    } else if (dir === "RIGHT") {
      grad = ctx.createLinearGradient(x + w, y, x + w + len, y);
      grad.addColorStop(0, "rgba(255, 232, 133, 0.35)"); grad.addColorStop(1, "rgba(255, 232, 133, 0)");
      ctx.fillStyle = grad; ctx.fillRect(x + w, y + 4, len, h - 8);
    }
    ctx.restore();
  }

  drawSeatCushion(x, y, color) {
    const { ctx } = this;
    ctx.beginPath(); ctx.arc(x, y, 2.3, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.globalAlpha = 0.65; ctx.fill(); ctx.globalAlpha = 1.0;
  }

  renderFX(game) {
    const { ctx } = this; const { particles, floatingTexts } = game;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.032;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i]; ft.y -= 1.1; ft.life -= 0.022;
      if (ft.life <= 0) { floatingTexts.splice(i, 1); continue; }
      ctx.globalAlpha = ft.life; ctx.fillStyle = ft.color;
      ctx.font = "900 13px sans-serif"; ctx.textAlign = "center"; ctx.fillText(ft.str, ft.x, ft.y);
    }
    ctx.globalAlpha = 1.0;
  }

  roundRect(x, y, width, height, radius, fill, stroke) {
    const { ctx } = this;
    ctx.beginPath(); ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y); ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius); ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height); ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius); ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill(); if (stroke) ctx.stroke();
  }
}
