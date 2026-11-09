// ============================================
// COCOON CONNECT - FARMER PORTAL
// ============================================

const imageInput = document.getElementById("cocoonImages");
const imagePreview = document.getElementById("imagePreview");
const listingForm = document.getElementById("listingForm");

const qualityResult = document.getElementById("qualityResult");
const analysisStatus = document.getElementById("analysisStatus");

const yourCropsGrid = document.getElementById("yourCropsGrid");
const toast = document.getElementById("toast");

let selectedFiles = [];
let currentOffer = null;

const savedCrops = [];

// ============================================
// 1. TOAST MESSAGE
// ============================================

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ============================================
// 2. HTML SECURITY
// ============================================

function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

// ============================================
// 3. IMAGE PREVIEW
// ============================================

function renderImagePreview() {
  imagePreview.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const imageURL = URL.createObjectURL(file);

    const item = document.createElement("div");
    item.className = "preview-item";

    const image = document.createElement("img");
    image.src = imageURL;
    image.alt = "Cocoon image preview";

    const removeButton = document.createElement("button");

    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", "Remove image");

    removeButton.addEventListener("click", () => {
      selectedFiles.splice(index, 1);

      URL.revokeObjectURL(imageURL);

      renderImagePreview();

      if (selectedFiles.length > 0) {
        runAutomaticDemoAssessment();
      } else {
        resetQualityResult();
      }
    });

    item.appendChild(image);
    item.appendChild(removeButton);

    imagePreview.appendChild(item);
  });
}

// ============================================
// 4. RESET QUALITY RESULT
// ============================================

function resetQualityResult() {
  currentOffer = null;

  analysisStatus.textContent =
    "Upload a cocoon photo to start the preliminary demo assessment.";

  qualityResult.innerHTML = `
        <span class="result-placeholder">
            Your indicative demo rate will appear here after photo upload.
        </span>
    `;

  document.getElementById("qualityStatus").textContent = "Not checked";
}

// ============================================
// 5. AUTOMATIC DEMO QUALITY ASSESSMENT
// ============================================

function runAutomaticDemoAssessment() {
  if (selectedFiles.length === 0) {
    resetQualityResult();
    return;
  }

  analysisStatus.textContent = "Preparing your sample quality estimate...";

  /*
       IMPORTANT:

       This is a FRONTEND DEMO only.

       It does NOT analyse uploaded image pixels.
       It does NOT use a trained AI model.

       Later, a Python AI API will replace this function.
    */

  const baseMarketRate = 520;

  const demoGrade = "Good";

  const qualityMultiplier = 1.04;

  const estimatedRate = Math.round(baseMarketRate * qualityMultiplier);

  currentOffer = {
    grade: demoGrade,
    offer: estimatedRate,
    baseRate: baseMarketRate,
  };

  analysisStatus.textContent =
    "Demo assessment completed. This is not an actual AI prediction.";

  qualityResult.innerHTML = `

        <div class="result-score">
            ₹${estimatedRate}
            <small>/ kg · Indicative demo rate</small>
        </div>

        <div class="result-meta">

            <b>Demo Quality:</b> ${demoGrade}<br>

            <b>Sample Market Rate:</b> ₹${baseMarketRate}/kg<br>

            <b>Offer Status:</b> Pending Admin Review<br>

            Physical inspection is required for final quality and price.

        </div>

    `;

  document.getElementById("qualityStatus").textContent = "Demo estimate ready";
}

// ============================================
// 6. PHOTO UPLOAD EVENT
// ============================================

imageInput.addEventListener("change", () => {
  const incomingFiles = Array.from(imageInput.files || []);

  const validFiles = incomingFiles.filter((file) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    const validType = allowedTypes.includes(file.type);

    const validSize = file.size <= 5 * 1024 * 1024;

    if (!validType) {
      showToast(file.name + ": Invalid image format.");
    }

    if (!validSize) {
      showToast(file.name + ": Maximum image size is 5 MB.");
    }

    return validType && validSize;
  });

  const remainingSlots = Math.max(0, 5 - selectedFiles.length);

  const filesToAdd = validFiles.slice(0, remainingSlots);

  selectedFiles = [...selectedFiles, ...filesToAdd];

  if (validFiles.length > remainingSlots) {
    showToast("Maximum 5 images are allowed.");
  }

  renderImagePreview();

  // Allow selecting the same file again
  imageInput.value = "";

  if (selectedFiles.length > 0) {
    runAutomaticDemoAssessment();

    showToast("Photo uploaded. Demo estimate is ready.");
  }
});

// ============================================
// 7. SAVE COCOON LISTING
// ============================================

listingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  // Validate normal form fields
  if (!listingForm.reportValidity()) {
    return;
  }

  // Photo is compulsory
  if (selectedFiles.length === 0) {
    showToast("Please upload at least one cocoon photo.");

    return;
  }

  // Quality estimate must exist
  if (!currentOffer) {
    showToast("Please upload a photo and wait for the demo estimate.");

    return;
  }

  // ========================================
  // GET FARMER PRICE REQUEST
  // ========================================

  const requestedRateValue = document
    .getElementById("farmerRequestedRate")
    .value.trim();

  const requestReasonValue = document
    .getElementById("farmerRequestReason")
    .value.trim();

  // If price is entered, reason is compulsory
  if (requestedRateValue && !requestReasonValue) {
    showToast("Please enter the reason for your requested price.");

    document.getElementById("farmerRequestReason").focus();

    return;
  }

  // If reason is entered, price is compulsory
  if (!requestedRateValue && requestReasonValue) {
    showToast("Please enter your requested price.");

    document.getElementById("farmerRequestedRate").focus();

    return;
  }

  const requestedRate = requestedRateValue ? Number(requestedRateValue) : null;

  if (
    requestedRate !== null &&
    (!Number.isFinite(requestedRate) || requestedRate <= 0)
  ) {
    showToast("Please enter a valid requested price.");

    return;
  }

  // ========================================
  // GENERATE LISTING ID
  // ========================================

  const listingID = "CC-" + Date.now();

  const imageID = "IMG-" + Date.now();

  // Create image URLs for this browser session
  const savedImageURLs = selectedFiles.map((file) => URL.createObjectURL(file));

  // ========================================
  // COLLECT FARMER DETAILS
  // ========================================

  const crop = {
    id: listingID,

    imageID: imageID,

    images: savedImageURLs,

    type: document.getElementById("cocoonType").value,

    quantity: Number(document.getElementById("quantity").value),

    expectedRate: Number(document.getElementById("expectedRate").value),

    harvestDate: document.getElementById("harvestDate").value,

    village: document.getElementById("village").value.trim(),

    district: document.getElementById("district").value.trim(),

    pincode: document.getElementById("pincode").value.trim(),

    phone: document.getElementById("phone").value.trim(),

    notes: document.getElementById("notes").value.trim(),

    pickup: document.getElementById("pickup").checked,

    grade: currentOffer.grade,

    offer: currentOffer.offer,

    baseRate: currentOffer.baseRate,

    // Farmer price request
    requestedRate: requestedRate,

    requestReason: requestReasonValue,

    // Admin review status
    requestStatus:
      requestedRate !== null ? "Pending Admin Review" : "No Price Request",

    // Overall listing status
    listingStatus: "Submitted",

    submittedAt: new Date().toLocaleString(),
  };

  // ========================================
  // SAVE LISTING IN CURRENT BROWSER SESSION
  // ========================================

  savedCrops.unshift(crop);

  // Update dashboard
  updateDashboard();

  // Display complete report
  renderYourCrops();

  showToast("Cocoon listing saved successfully.");

  // Scroll to Your Crops
  document.getElementById("yourCrops").scrollIntoView({
    behavior: "smooth",
  });

  // ========================================
  // RESET FORM FOR NEXT LISTING
  // ========================================

  listingForm.reset();

  selectedFiles = [];

  currentOffer = null;

  imagePreview.innerHTML = "";

  document.getElementById("farmerRequestedRate").value = "";

  document.getElementById("farmerRequestReason").value = "";

  resetQualityResult();
});

// ============================================
// 8. UPDATE DASHBOARD STATISTICS
// ============================================

function updateDashboard() {
  const totalQuantity = savedCrops.reduce(
    (total, crop) => total + crop.quantity,
    0,
  );

  document.getElementById("totalListings").textContent = savedCrops.length;

  document.getElementById("listedStock").textContent = totalQuantity + " kg";

  document.getElementById("cropCount").textContent =
    savedCrops.length + (savedCrops.length === 1 ? " listing" : " listings");
}

// ============================================
// 9. DISPLAY YOUR CROPS
// ============================================

function renderYourCrops() {
  if (savedCrops.length === 0) {
    yourCropsGrid.innerHTML = `

            <div class="empty-crops panel">

                <div class="empty-icon">▧</div>

                <h3>No crops saved yet</h3>

                <p>
                    Upload cocoon photos, enter your details
                    and save your first listing.
                </p>

                <a href="#upload" class="primary-btn">
                    Add Your First Crop →
                </a>

            </div>

        `;

    updateDashboard();

    return;
  }

  yourCropsGrid.innerHTML = savedCrops
    .map(
      (crop, index) => `

        <article class="crop-report-card">

            <!-- REPORT HEADER -->

            <div class="crop-report-header">

                <h3>Cocoon Quality Report</h3>

                <span class="analysis-badge">
                    Demo assessment completed
                </span>

            </div>


            <!-- IMAGE DETAILS -->

            <div class="crop-image-info">

                <img
                    src="${crop.images[0]}"
                    alt="Uploaded cocoon image"
                >

                <div>

                    <b>Uploaded Cocoon Image</b>

                    <span>Image ID: ${escapeHTML(crop.imageID)}</span>

                    <span>Listing ID: ${escapeHTML(crop.id)}</span>

                    <span>Photos: ${crop.images.length}</span>

                    <span>Status: Saved</span>

                </div>

            </div>


            <!-- FARMER DETAILS -->

            <table class="crop-report-table">

                <tr>
                    <th>Details</th>
                    <th>Farmer Listing</th>
                </tr>

                <tr>
                    <td>Cocoon Type</td>
                    <td>${escapeHTML(crop.type)}</td>
                </tr>

                <tr>
                    <td>Quantity</td>
                    <td>${crop.quantity} kg</td>
                </tr>

                <tr>
                    <td>Farmer Expected Rate</td>
                    <td>₹${crop.expectedRate}/kg</td>
                </tr>

                <tr>
                    <td>Demo Quality Grade</td>
                    <td>${escapeHTML(crop.grade)}</td>
                </tr>

                <tr>
                    <td>Estimated Offer Rate</td>
                    <td>₹${crop.offer}/kg</td>
                </tr>

                <tr>
                    <td>Offer Status</td>
                    <td>${escapeHTML(crop.requestStatus)}</td>
                </tr>

                <tr>
                    <td>Harvest Date</td>
                    <td>${escapeHTML(crop.harvestDate)}</td>
                </tr>

                <tr>
                    <td>Village</td>
                    <td>${escapeHTML(crop.village)}</td>
                </tr>

                <tr>
                    <td>District</td>
                    <td>${escapeHTML(crop.district)}</td>
                </tr>

                <tr>
                    <td>PIN Code</td>
                    <td>${escapeHTML(crop.pincode)}</td>
                </tr>

                <tr>
                    <td>Contact Number</td>
                    <td>${escapeHTML(crop.phone)}</td>
                </tr>

                <tr>
                    <td>Doorstep Pickup</td>
                    <td>${crop.pickup ? "Requested" : "Not Requested"}</td>
                </tr>

                <tr>
                    <td>Submitted On</td>
                    <td>${escapeHTML(crop.submittedAt)}</td>
                </tr>

            </table>


            ${
              crop.notes
                ? `
                        <p class="crop-report-note">
                            <b>Additional Details:</b>
                            ${escapeHTML(crop.notes)}
                        </p>
                    `
                : ""
            }


            <!-- FARMER PRICE REQUEST DETAILS -->

            ${
              crop.requestedRate !== null
                ? `

                        <div class="price-request-summary">

                            <strong>Farmer Price Request</strong><br>

                            Requested Price:
                            ₹${crop.requestedRate}/kg<br>

                            Reason:
                            ${escapeHTML(crop.requestReason)}<br>

                            Request Status:
                            <span class="pending-label">
                                ${escapeHTML(crop.requestStatus)}
                            </span>

                        </div>

                    `
                : `

                        <p class="crop-report-note">
                            Farmer has not requested a revised price.
                        </p>

                    `
            }


            <p class="crop-report-note">

                Your listing has been submitted.
                Cocoon Connect team will review your details
                and price request, if submitted.

                Final quality and price require physical inspection.

            </p>

        </article>

    `,
    )
    .join("");

  updateDashboard();
}

// ============================================
// 10. AVAILABILITY TOGGLE
// ============================================

document
  .getElementById("availabilityToggle")
  .addEventListener("change", (event) => {
    document.getElementById("availabilityText").textContent = event.target
      .checked
      ? "Available"
      : "Not Available";

    showToast(
      event.target.checked
        ? "Stock marked available in this demo."
        : "Stock marked unavailable in this demo.",
    );
  });

// ============================================
// 11. HELP BUTTON
// ============================================

document.getElementById("helpBtn").addEventListener("click", () => {
  alert(
    "COCOON CONNECT - FARMER PORTAL\n\n" +
      "1. Upload cocoon photos.\n" +
      "2. View the sample quality estimate.\n" +
      "3. Enter harvest and location details.\n" +
      "4. Enter your expected price request if needed.\n" +
      "5. Save your cocoon listing.\n" +
      "6. View your complete report in Your Crops.\n\n" +
      "Your price request is marked Pending Admin Review.\n\n" +
      "This is a frontend demo. No trained AI or backend is connected.",
  );
});

// ============================================
// 12. HARVEST DATE VALIDATION
// ============================================

document.getElementById("harvestDate").max = new Date()
  .toISOString()
  .split("T")[0];

// ============================================
// 13. INITIAL DASHBOARD
// ============================================

renderYourCrops();

updateDashboard();
