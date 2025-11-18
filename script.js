document.addEventListener("DOMContentLoaded", async () => {
  const user = await window.checkUser();
  updateNavigation(user);
  const currentPage = window.location.pathname.split("/").pop();
  if (currentPage === "index.html" || currentPage === "") {
    loadAndDisplayHotels();
    setupHotelCardScrolling();
  } else if (currentPage === "hotel-details.html") {
    loadHotelDetails();
  } else if (currentPage === "logindex.html") {
    setupAuthForms();
  }
  document.querySelectorAll(".logout-button").forEach((button) => {
    button.addEventListener("click", handleLogout);
  });
  setupHeroTextEffect();
  flatpickr("#checkin", {
    dateFormat: "Y-m-d",
    minDate: "today",
    onChange: function (selectedDates, dateStr, instance) {
      const checkoutField = document.querySelector("#checkout");
      if (checkoutField) {
        checkoutField._flatpickr.set("minDate", dateStr);
      }
    },
  });
  flatpickr("#checkout", {
    dateFormat: "Y-m-d",
    minDate: "today",
  });
});

function updateNavigation(user) {
  const loginButtons = document.querySelectorAll(".login-button");
  const logoutButtons = document.querySelectorAll(".logout-button");
  const userProfileElements = document.querySelectorAll(".user-profile");
  const avatarButtons = document.querySelectorAll(
    "#avatarButton, #mobileAvatarButton"
  );
  const userAvatars = document.querySelectorAll(
    "#userAvatar, #mobileUserAvatar"
  );
  const defaultAvatars = document.querySelectorAll(
    "#defaultAvatar, #mobileDefaultAvatar"
  );

  if (user) {
    loginButtons.forEach((btn) => (btn.style.display = "none"));
    logoutButtons.forEach((btn) => (btn.style.display = "block"));
    userProfileElements.forEach((el) => {
      el.style.display = "flex";
      const nameElement = el.querySelector(".user-name");
      if (nameElement) {
        nameElement.textContent = user.email.split("@")[0];
      }
    });

    // Handle avatar display with cache-busting
    if (window.userAvatarUrl) {
      const cacheBustedUrl = window.userAvatarUrl.includes("?")
        ? window.userAvatarUrl
        : window.userAvatarUrl + "?t=" + new Date().getTime();

      avatarButtons.forEach((btn) => btn.classList.remove("hidden"));
      userAvatars.forEach((avatar) => {
        avatar.src = cacheBustedUrl;
        avatar.onload = () => {
          avatar.classList.remove("hidden");
          defaultAvatars.forEach(
            (defaultAvatar) => (defaultAvatar.style.display = "none")
          );
        };
        avatar.onerror = () => {
          avatar.classList.add("hidden");
          defaultAvatars.forEach(
            (defaultAvatar) => (defaultAvatar.style.display = "block")
          );
        };
      });
    } else {
      avatarButtons.forEach((btn) => btn.classList.remove("hidden"));
      userAvatars.forEach((avatar) => avatar.classList.add("hidden"));
      defaultAvatars.forEach(
        (defaultAvatar) => (defaultAvatar.style.display = "block")
      );
    }
  } else {
    loginButtons.forEach((btn) => (btn.style.display = "block"));
    logoutButtons.forEach((btn) => (btn.style.display = "none"));
    userProfileElements.forEach((el) => (el.style.display = "none"));
    avatarButtons.forEach((btn) => btn.classList.add("hidden"));
  }
}

async function handleLogout(e) {
  e.preventDefault();
  await window.signOut();
}

async function loadAndDisplayHotels() {
  try {
    const { data: hotels, error } = await window.supabase.from("hotels")
      .select(`
                *,
                ratings(rating)
            `);
    if (error) {
      console.error("Error fetching hotels:", error);
      renderHotelList(window.sampleHotels);
      return;
    }
    if (hotels && hotels.length > 0) {
      const processedHotels = hotels.map((hotel) => {
        const hasRatings = hotel.ratings && hotel.ratings.length > 0;
        const avgRating = hasRatings
          ? hotel.ratings.reduce((sum, r) => sum + r.rating, 0) /
            hotel.ratings.length
          : 0;
        return {
          ...hotel,
          rating: avgRating,
          ratingCount: hasRatings ? hotel.ratings.length : 0,
        };
      });
      renderHotelList(processedHotels);
    } else {
      const processedSampleHotels = window.sampleHotels.map((hotel) => ({
        ...hotel,
        rating: hotel.rating || 0,
        ratingCount: hotel.ratingCount || 0,
      }));
      renderHotelList(processedSampleHotels);
    }
  } catch (error) {
    console.error("Error in loadAndDisplayHotels:", error);
    const processedSampleHotels = window.sampleHotels.map((hotel) => ({
      ...hotel,
      rating: hotel.rating || 0,
      ratingCount: hotel.ratingCount || 0,
    }));
    renderHotelList(processedSampleHotels);
  }
}

async function displayHotels(hotels) {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const hotelId = urlParams.get("id");
    if (!hotelId) {
      console.error("No hotel ID provided");
      document.getElementById("hotel-details").innerHTML = `
                <div class="text-center p-8">
                    <h2 class="text-2xl font-bold mb-4">Hotel Not Found</h2>
                    <p class="text-gray-600">The hotel you're looking for doesn't exist or was removed.</p>
                    <a href="index.html" class="mt-4 inline-block px-6 py-2 bg-purple-600 text-white rounded-lg">
                        Back to Hotels
                    </a>
                </div>
            `;
      return;
    }
    const hotel = await window.getHotelById(hotelId);
    if (!hotel) {
      document.getElementById("hotel-details").innerHTML = `
                <div class="text-center p-8">
                    <h2 class="text-2xl font-bold mb-4">Hotel Not Found</h2>
                    <p class="text-gray-600">The hotel you're looking for doesn't exist or was removed.</p>
                    <a href="index.html" class="mt-4 inline-block px-6 py-2 bg-purple-600 text-white rounded-lg">
                        Back to Hotels
                    </a>
                </div>
            `;
      return;
    }
    const formattedPrice = `<span class=\"icon-saudi_riyal\">&#xea;</span>${hotel.price}`;
    const ratingStars = window.generateStarRating
      ? window.generateStarRating(hotel.rating)
      : "";
    document.getElementById("hotel-name").textContent = hotel.name;
    document.getElementById("hotel-location").textContent = hotel.description || "No description";
    document.getElementById("hotel-image").src = hotel.image;
    document.getElementById("hotel-image").alt = hotel.name;
    const priceElement = document.getElementById("hotel-price");
    if (priceElement) {
      priceElement.innerHTML = `${formattedPrice}`;
    }
    const ratingElement = document.getElementById("hotel-rating");
    if (ratingElement) {
      ratingElement.innerHTML = ratingStars;
    }
    setupRatingSubmission(hotelId);
  } catch (error) {
    console.error("Error in loadHotelDetails:", error);
  }
}

async function loadHotelDetails() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const hotelId = urlParams.get("id");
    if (!hotelId) {
      console.error("No hotel ID provided");
      document.getElementById("hotel-details").innerHTML = `
                <div class="text-center p-8">
                    <h2 class="text-2xl font-bold mb-4">Hotel Not Found</h2>
                    <p class="text-gray-600">The hotel you're looking for doesn't exist or was removed.</p>
                    <a href="index.html" class="mt-4 inline-block px-6 py-2 bg-purple-600 text-white rounded-lg">
                        Back to Hotels
                    </a>
                </div>
            `;
      return;
    }
    await renderHotelDetails(hotelId);
  } catch (error) {
    console.error("Error in loadHotelDetails:", error);
  }
}

async function renderHotelDetails(hotelId) {
  try {
    const hotel = await window.getHotelById(hotelId);
    if (!hotel) {
      document.getElementById("hotel-details").innerHTML = `
                <div class="text-center p-8">
                    <h2 class="text-2xl font-bold mb-4">Hotel Not Found</h2>
                    <p class="text-gray-600">The hotel you're looking for doesn't exist or was removed.</p>
                    <a href="index.html" class="mt-4 inline-block px-6 py-2 bg-purple-600 text-white rounded-lg">
                        Back to Hotels
                    </a>
                </div>
            `;
      return;
    }
    const formattedPrice = `<span class=\"icon-saudi_riyal\">&#xea;</span>${hotel.price}`;
    const ratingStars = window.generateDetailStarRating(hotel.rating);
    document.getElementById("hotel-name").textContent = hotel.name;
    document.getElementById("hotel-location").textContent = hotel.description || "No description";
    document.getElementById("hotel-image").src = hotel.image;
    document.getElementById("hotel-image").alt = hotel.name;
    const priceElement = document.getElementById("hotel-price");
    if (priceElement) {
      priceElement.innerHTML = `${formattedPrice}`;
    }
    const ratingElement = document.getElementById("hotel-rating");
    if (ratingElement) {
      ratingElement.innerHTML = ratingStars;
    }
    setupRatingSubmission(hotelId);
  } catch (error) {
    console.error("Error in renderHotelDetails:", error);
  }
}

function setupRatingSubmission(hotelId) {
  const ratingStars = document.querySelectorAll(".rating-star");
  const submitRatingButton = document.getElementById("submit-rating");
  if (!ratingStars.length || !submitRatingButton) return;
  let selectedRating = 0;
  ratingStars.forEach((star, index) => {
    const ratingValue = parseInt(star.getAttribute("data-value") || index + 1);
    star.addEventListener("mouseover", () => {
      ratingStars.forEach((s, i) => {
        if (i <= index) {
          s.classList.add("text-yellow-400");
          s.classList.remove("text-gray-300");
        } else {
          s.classList.add("text-gray-300");
          s.classList.remove("text-yellow-400");
        }
      });
    });
    star.addEventListener("mouseout", () => {
      ratingStars.forEach((s, i) => {
        if (i < selectedRating) {
          s.classList.add("text-yellow-400");
          s.classList.remove("text-gray-300");
        } else {
          s.classList.add("text-gray-300");
          s.classList.remove("text-yellow-400");
        }
      });
    });
    star.addEventListener("click", () => {
      selectedRating = ratingValue;
      ratingStars.forEach((s, i) => {
        if (i < selectedRating) {
          s.classList.add("text-yellow-400");
          s.classList.remove("text-gray-300");
        } else {
          s.classList.add("text-gray-300");
          s.classList.remove("text-yellow-400");
        }
      });
    });
  });
  submitRatingButton.addEventListener("click", async () => {
    if (selectedRating === 0) {
      alert("Please select a rating before submitting");
      return;
    }
    try {
      const result = await window.submitHotelRating(hotelId, selectedRating);
      if (result.success) {
        alert(result.message);
        window.location.reload();
      } else {
        alert(result.message || "Failed to submit rating");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("An error occurred while submitting your rating");
    }
  });
}

function setupAuthForms() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('input[type="email"]').value;
      const password = loginForm.querySelector('input[type="password"]').value;
      try {
        const result = await window.signIn(email, password);
        if (result.success) {
          window.location.href = "index.html";
        } else {
          alert(result.message || "Failed to sign in");
        }
      } catch (error) {
        console.error("Error signing in:", error);
        alert("An error occurred while signing in");
      }
    });
  }
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = registerForm.querySelector('input[name="name"]').value;
      const email = registerForm.querySelector('input[type="email"]').value;
      const password = registerForm.querySelector(
        'input[type="password"]'
      ).value;
      try {
        const result = await window.signUp(email, password, name);
        if (result.success) {
          alert(
            "Registration successful! Please check your email to verify your account."
          );
          document
            .querySelector(".sign-in-container")
            .classList.add("right-panel-active");
        } else {
          alert(result.message || "Failed to register");
        }
      } catch (error) {
        console.error("Error registering:", error);
        alert("An error occurred while registering");
      }
    });
  }
}

function setupHeroTextEffect() {
  const heroHeading = document.getElementById("hero-heading");
  const heroSection = document.querySelector(".hero-section");
  if (!heroHeading || !heroSection) return;
  function getHeroSectionEnd() {
    const rect = heroSection.getBoundingClientRect();
    return rect.top + window.scrollY + rect.height;
  }
  window.addEventListener("scroll", () => {
    const sectionTop = heroSection.offsetTop;
    const sectionHeight = heroSection.offsetHeight;
    const scrollY = window.scrollY;
    let progress = (scrollY - sectionTop) / sectionHeight;
    progress = Math.min(Math.max(progress, 0), 1);
    heroHeading.style.opacity = 1 - progress;
    heroHeading.style.transform = `translateY(${
      progress * sectionHeight * 0.5
    }px)`;
  });
}

function setupHotelCardScrolling() {
  const arrowLeft = document.getElementById("arrow-left");
  const arrowRight = document.getElementById("arrow-right");
  const hotelsContainer = document.getElementById("hotels-container");
  if (!arrowLeft || !arrowRight || !hotelsContainer) return;
  arrowLeft.addEventListener("click", () => {
    hotelsContainer.scrollBy({
      left: -300,
      behavior: "smooth",
    });
  });
  arrowRight.addEventListener("click", () => {
    hotelsContainer.scrollBy({
      left: 300,
      behavior: "smooth",
    });
  });
}

async function renderHotelList(hotels) {
  const hotelsContainer = document.getElementById("hotels-container");
  if (!hotelsContainer) return;
  hotelsContainer.innerHTML = `
    <div class="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 flex justify-center">
      <div class="animate-pulse text-center p-8">
        <p class="text-lg text-gray-600">Loading hotels...</p>
      </div>
    </div>
  `;
  for (const hotel of hotels) {
    try {
      const mainImageUrl = await window.getHotelMainImage(hotel.id);
      const card = document.createElement("div");
      card.className =
        "snap-start flex-shrink-0 w-80 sm:w-72 md:w-80 lg:w-96 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col";
      const formattedPrice = `<span class="icon-saudi_riyal">&#xea;</span>${hotel.price}`;
      const rating = hotel.rating || 0.0;
      const ratingStars = window.generateDetailStarRating
        ? window.generateDetailStarRating(rating)
        : '<div class="text-amber-500">★★★★★</div>';
      const hotelLink = window.isLoggedIn
        ? `hotel-details.html?id=${hotel.id}`
        : `logindex.html`;
      card.innerHTML = `
        <div class="relative w-full h-48">
          <img src="${mainImageUrl || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="}" alt="${
        hotel.name
      }" class="w-full h-full object-cover">
        </div>
        <div class="p-5 flex flex-col flex-grow">
          <div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">${hotel.name}</h3>
            <div class="flex items-center mb-4">
              <span class="text-gray-600">${hotel.description || "No description"}</span>
            </div>
          </div>
          <div class="mt-auto">
            <div class="flex items-center text-amber-500 mb-3">
              <span class="font-bold mr-2">${rating.toFixed(1)}</span>
              ${ratingStars}
              <span class="ml-1 text-sm text-gray-600">(${
                hotel.ratingCount || 0
              })</span>
            </div>
            <div class="text-lg font-bold text-gray-800">${formattedPrice}</div>
          </div>
        </div>
      `;
      card.style.cursor = "pointer";
      card.addEventListener("click", () => {
        window.location.href = hotelLink;
      });
      if (hotelsContainer.innerHTML.includes("Loading hotels")) {
        hotelsContainer.innerHTML = "";
      }
      hotelsContainer.appendChild(card);
    } catch (error) {
      console.error(`Error processing hotel ${hotel.id}:`, error);
    }
  }
  if (hotels.length === 0) {
    hotelsContainer.innerHTML = `
      <div class="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 flex justify-center">
        <div class="text-center p-8">
          <p class="text-lg text-gray-600">No hotels available at this time.</p>
        </div>
      </div>
    `;
  }
}
