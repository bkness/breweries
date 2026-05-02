document.addEventListener("click", async (e) => {
  const deleteBtn = e.target.closest(".btn-delete-brewery");
  const mapBtn = e.target.closest(".btn-map-saved");
  const closeBtn = e.target.closest("#close-mypubs-map");
  const modal = document.getElementById("mypubs-map-modal");

  if (deleteBtn) {
    const brewid = deleteBtn.getAttribute("data-id");
    const breurl = `/api/breweries/${brewid}`;

    const response = await fetch(breurl, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      document.location.replace("/api/breweries");
    } else {
      alert("Failed to delete brewery");
    }
  }

  if (mapBtn) {
    openSavedMap(mapBtn);
  }

  if (closeBtn || (modal && e.target.id === "mypubs-map-modal")) {
    closeSavedMap();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeSavedMap();
  }
});

let mypubsMap;
let mypubsMarker;

function openSavedMap(btn) {
  const name = btn.dataset.name;
  const lat = parseFloat(btn.dataset.lat);
  const lng = parseFloat(btn.dataset.lng);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return;
  }

  const modal = document.getElementById("mypubs-map-modal");
  modal.classList.remove("hidden");
  requestAnimationFrame(() => {
    modal.classList.add("active");
  });
  document.body.style.overflow = "hidden";

  setTimeout(() => {
    if (!mypubsMap) {
      mypubsMap = L.map("mypubs-modal-map").setView([lat, lng], 13);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(mypubsMap);
    } else {
      mypubsMap.invalidateSize();
      mypubsMap.setView([lat, lng], 13);
    }

    if (mypubsMarker) {
      mypubsMap.removeLayer(mypubsMarker);
    }

    mypubsMarker = L.marker([lat, lng])
      .addTo(mypubsMap)
      .bindPopup(name)
      .openPopup();
  }, 120);
}

function closeSavedMap() {
  const modal = document.getElementById("mypubs-map-modal");
  if (!modal || modal.classList.contains("hidden")) {
    return;
  }

  modal.classList.remove("active");
  const onTransitionEnd = () => {
    modal.classList.add("hidden");
    modal.removeEventListener("transitionend", onTransitionEnd);
  };
  modal.addEventListener("transitionend", onTransitionEnd);
  document.body.style.overflow = "";
}
