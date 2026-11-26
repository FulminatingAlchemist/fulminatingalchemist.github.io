(() => {
  const ceiling = document.querySelector(".viva-ceiling");
  const drawing = ceiling.querySelector(".viva-drawing");
  const markers = ceiling.querySelector(".viva-markers");
  const lookup = ceiling.querySelector(".viva-lookup");
  const locations = lookup.querySelector("select");
  const detailTitle = ceiling.querySelector("#viva-details-title");
  const status = ceiling.querySelector(".viva-status");
  const list = ceiling.querySelector(".viva-records");
  const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" });
  const widths = [30, 90, 90, 90, 90, 90, 90, 90, 30];
  const heights = [90, 90, 90, 90, 90, 30];
  const inset = 30;
  const lampTiles = new Set(["2,3", "2,7", "5,3", "5,7"]);

  function svg(parent, tag, attributes, label) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    if (label) element.textContent = label;
    parent.append(element);
    return element;
  }

  function tileBox(row, column) {
    return {
      x: inset + widths.slice(0, column - 1).reduce((sum, width) => sum + width, 0),
      y: inset + heights.slice(0, row - 1).reduce((sum, height) => sum + height, 0),
      width: widths[column - 1],
      height: heights[row - 1],
    };
  }

  function subcellBox(tile, subcell) {
    const { x, y, width, height } = tileBox(tile.row, tile.column);
    return {
      x: x + ((subcell.column - 1) * width) / 3,
      y: y + ((subcell.row - 1) * height) / 3,
      width: width / 3,
      height: height / 3,
    };
  }

  function drawTiles() {
    widths.forEach((width, index) => {
      const { x } = tileBox(1, index + 1);
      svg(drawing, "text", { x: x + width / 2, y: 19, class: "viva-axis", "data-column": index + 1 }, index + 1);
    });
    heights.forEach((height, rowIndex) => {
      const row = rowIndex + 1;
      const { y } = tileBox(row, 1);
      svg(drawing, "text", { x: 15, y: y + height / 2 + 4, class: "viva-axis", "data-row": row }, row);
      widths.forEach((_, columnIndex) => {
        const column = columnIndex + 1;
        const address = row + "," + column;
        const tile = svg(drawing, "g", { class: "viva-tile", "data-tile": address });
        const { x, y, width, height } = tileBox(row, column);
        svg(tile, "rect", { x, y, width, height, class: "viva-tile-surface" });
        if (lampTiles.has(address)) {
          svg(tile, "rect", {
            x: x + 5,
            y: y + 5,
            width: width - 10,
            height: height - 10,
            rx: 3,
            class: "viva-lamp",
            "data-fixture": "lamp",
            "data-tile": address,
          });
        }
        for (let subRow = 1; subRow <= 3; subRow++) {
          for (let subColumn = 1; subColumn <= 3; subColumn++) {
            const box = subcellBox({ row, column }, { row: subRow, column: subColumn });
            svg(tile, "rect", { ...box, class: "viva-subcell", "data-subcell": subRow + "," + subColumn });
          }
        }
      });
    });
  }

  function drawFixtures() {
    const fixtures = svg(drawing, "g", { class: "viva-fixtures", "aria-hidden": "true" });
    const alarmBox = tileBox(3, 5);
    const alarm = svg(fixtures, "g", {
      transform: "translate(" + (alarmBox.x + 45) + " " + (alarmBox.y + 45) + ")",
      "data-fixture": "alarm",
      "data-tile": "3,5",
    });
    svg(alarm, "circle", { r: 12, class: "viva-alarm" });
    svg(alarm, "circle", { r: 5, class: "viva-alarm-centre" });

    const emergencyBox = tileBox(3, 4);
    const emergency = svg(fixtures, "g", {
      transform: "translate(" + (emergencyBox.x + 45) + " " + (emergencyBox.y + 45) + ")",
      "data-fixture": "emergency",
      "data-tile": "3,4",
    });
    svg(emergency, "rect", { x: -17, y: -8, width: 34, height: 16, rx: 4, class: "viva-emergency" });
    svg(emergency, "circle", { cx: -8, r: 4, class: "viva-emergency-bulb" });
    svg(emergency, "circle", { cx: 8, r: 4, class: "viva-emergency-bulb" });

    const upper = subcellBox({ row: 3, column: 6 }, { row: 3, column: 3 });
    const router = svg(fixtures, "g", {
      transform: "translate(" + (upper.x + upper.width / 2) + " " + (upper.y + upper.height) + ")",
      "data-fixture": "router",
    });
    svg(router, "rect", { x: -11, y: -21, width: 22, height: 42, rx: 5, class: "viva-router" });
    svg(router, "path", { d: "M-6 -4 Q0 -10 6 -4 M-3 0 Q0 -3 3 0 M0 4 h.1", class: "viva-router-signal" });
  }

  function validPosition(position, rows, columns) {
    return (
      position &&
      Number.isInteger(position.row) &&
      position.row >= 1 &&
      position.row <= rows &&
      Number.isInteger(position.column) &&
      position.column >= 1 &&
      position.column <= columns
    );
  }

  function groupRecords(data) {
    if (!Array.isArray(data)) throw new TypeError("Expected an array of viva records");
    const groups = new Map();
    const ids = new Set();
    for (const record of data) {
      if (!record || ![record.id, record.name, record.vivaDate, record.thesisTitle].every((value) => typeof value === "string" && value.trim()))
        continue;
      if (!validPosition(record.tile, heights.length, widths.length) || !validPosition(record.subcell, 3, 3)) continue;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(record.vivaDate) || record.vivaDate.startsWith("0000")) continue;
      const date = new Date(record.vivaDate + "T00:00:00Z");
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== record.vivaDate) continue;

      let url;
      if (record.thesisUrl !== undefined) {
        if (typeof record.thesisUrl !== "string") continue;
        try {
          url = new URL(record.thesisUrl);
        } catch (error) {
          continue;
        }
        if (url.protocol !== "https:" && url.protocol !== "http:") continue;
      }
      const id = record.id.trim();
      if (ids.has(id)) continue;
      ids.add(id);

      const { tile, subcell } = record;
      const key = [tile.row, tile.column, subcell.row, subcell.column].join("-");
      if (!groups.has(key)) groups.set(key, { tile, subcell, records: [] });
      groups.get(key).records.push(Object.assign({}, record, { date, url }));
    }
    return { groups, skipped: data.length - ids.size };
  }

  function addText(parent, tag, text) {
    const element = document.createElement(tag);
    element.textContent = text;
    parent.append(element);
    return element;
  }

  function renderRecords(groups, skipped) {
    const notice = skipped ? " Some records could not be displayed." : "";
    let activeMarker;

    function select(group, marker, focusDetails = false) {
      if (activeMarker) activeMarker.setAttribute("aria-pressed", "false");
      activeMarker = marker;
      list.replaceChildren();
      list.hidden = !group;
      detailTitle.textContent = "Cork impacts";
      status.textContent = (groups.size ? "Select a marker to view its viva records." : "No cork impacts have been recorded yet.") + notice;
      if (!group) return;

      marker.setAttribute("aria-pressed", "true");
      detailTitle.textContent = group.position;
      status.textContent = (group.records.length === 1 ? "1 cork impact." : group.records.length + " cork impacts.") + notice;
      for (const record of group.records) {
        const item = document.createElement("li");
        addText(item, "h3", record.name);
        const time = addText(item, "time", dateFormat.format(record.date));
        time.dateTime = record.vivaDate;
        if (typeof record.vivaTime === "string" && record.vivaTime.trim()) {
          item.append(document.createTextNode(" · " + record.vivaTime.trim()));
        }
        addText(item, "p", record.thesisTitle);
        if (record.url) {
          const link = addText(item, "a", "Open thesis");
          link.href = record.url.href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.setAttribute("aria-label", "Open thesis for " + record.name + " (opens in a new tab)");
        }
        list.append(item);
      }
      if (focusDetails) detailTitle.focus();
    }

    const viewBox = drawing.viewBox.baseVal;
    const buttons = new Map();
    for (const key of [...groups.keys()].sort()) {
      const group = groups.get(key);
      const { tile, subcell, records } = group;
      group.position = "Tile (" + tile.row + ", " + tile.column + "), subcell (" + subcell.row + ", " + subcell.column + ")";
      const summary = records.length === 1 ? records[0].name : records.length + " impacts";
      const label = summary + " · " + group.position;
      const option = addText(locations, "option", label);
      option.value = key;

      const box = subcellBox(tile, subcell);
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = "viva-marker";
      marker.style.left = (100 * box.x) / viewBox.width + "%";
      marker.style.top = (100 * box.y) / viewBox.height + "%";
      marker.style.width = (100 * box.width) / viewBox.width + "%";
      marker.style.height = (100 * box.height) / viewBox.height + "%";
      marker.title = label;
      marker.setAttribute("aria-label", label);
      marker.setAttribute("aria-controls", "viva-details");
      marker.setAttribute("aria-pressed", "false");
      const count = records.length > 99 ? "99+" : String(records.length);
      const dot = addText(marker, "span", records.length > 1 ? count : "");
      dot.setAttribute("aria-hidden", "true");
      marker.addEventListener("click", () => {
        locations.value = key;
        select(group, marker, true);
      });
      markers.append(marker);
      buttons.set(key, marker);
    }
    locations.addEventListener("change", () => {
      const group = groups.get(locations.value);
      select(group, buttons.get(locations.value));
    });
    lookup.hidden = !groups.size;
    select();
  }

  drawTiles();
  drawFixtures();
  fetch(ceiling.dataset.records)
    .then((response) => {
      if (!response.ok) throw new Error("Unable to fetch the viva archive");
      return response.json();
    })
    .then((data) => {
      const { groups, skipped } = groupRecords(data);
      renderRecords(groups, skipped);
    })
    .catch(() => {
      status.textContent = "The viva archive could not be loaded. Please try reloading the page.";
    });
})();
