// Sample hotel data as fallback when Supabase is not available
const hotels = [
  {
    id: 1,
    name: "Four Seasons Hotel",
    location: "Riadh, Saudi Arabia",
    price: 399,
    image:
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/113857950.jpg?k=93e381e54edcf9147ff2dc5664e869daa49e68d515cc793afb16ba28690f50e3&o=&hp=1",
  },
  {
    id: 2,
    name: "Garden Hotel",
    location: "Abha, Saudi Arabia",
    price: 249,
    image:
      "https://content.skyscnr.com/available/2006082616/2006082616_576x576.jpg",
  },
  {
    id: 3,
    name: "Al Safwah Royale Orchid",
    location: "Makkah, Saudi Arabia",
    price: 249,
    image:
      "https://content.r9cdn.net/rimg/himg/e2/9a/e9/expedia_group-624030-48b3deb2-422603.jpg?width=1366&height=768&crop=true",
  },
  {
    id: 4,
    name: "Anwar Al Madinah Mövenpick",
    location: "Medina, Saudi Arabia",
    price: 379,
    image:
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/592320119.jpg?k=7a097dc46180dbe972c76d58e01c5acd91e20b372c63f22fffde0497b62c5492&o=&hp=1",
  },
  {
    id: 5,
    name: "Le Meridien Bali Jimbaran",
    location: "Bali, Indonesia",
    price: 459,
    image:
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/590120309.jpg?k=0b2ee72b873eb00ad066e5cb7d6301c98f62cb86058e99d802d3a0e84f377e3f&o=&hp=1",
  },
  {
    id: 6,
    name: "Hilton Suites Makkah",
    location: "Makkah, Saudi Arabia",
    price: 429,
    image:
      "https://www.il.kayak.com/rimg/himg/01/49/5b/ice-2844332-99756697-185877.jpg?width=1366&height=768&crop=true",
  },
  {
    id: 7,
    name: "Raffles Makkah Palace",
    location: "Makkah, Saudi Arabia",
    price: 599,
    image:
      "https://q-xx.bstatic.com/xdata/images/hotel/max500/659374508.jpg?k=7baffca72e394e4a6d35415926c61252d447c59960a0a8aabe92896f9e07a72d&o=",
  },
  {
    id: 16,
    name: "Parisian Elegance Hotel",
    location: "Paris, France",
    price: 799,
    image: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg",
  },
  {
    id: 17,
    name: "Tokyo Skyline Suites",
    location: "Tokyo, Japan",
    price: 899,
    image: "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg",
  },
  {
    id: 18,
    name: "Sydney Harbour Retreat",
    location: "Sydney, Australia",
    price: 699,
    image: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg",
  },
  {
    id: 19,
    name: "Cape Town Luxury Lodge",
    location: "Cape Town, South Africa",
    price: 649,
    image: "https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg",
  },
];

document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is logged in
  const user = await window.checkUser();
  updateNavigation(user);

  // Get the current page
  const currentPage = window.location.pathname.split("/").pop();

  if (currentPage === "index.html" || currentPage === "") {
    loadAndDisplayHotels();
    setupHotelCardScrolling(); // Add this line to initialize arrow functionality
  } else if (currentPage === "hotel-details.html") {
    loadHotelDetails();
  } else if (currentPage === "logindex.html") {
    setupAuthForms();
  }

  // Handle logout button
  document.querySelectorAll(".logout-button").forEach((button) => {
    button.addEventListener("click", handleLogout);
  });

  // Initialize hero text scroll effect
  setupHeroTextEffect();
});

// Update navigation based on authentication status
function updateNavigation(user) {
  const loginButtons = document.querySelectorAll(".login-button");
  const logoutButtons = document.querySelectorAll(".logout-button");
  const userProfileElements = document.querySelectorAll(".user-profile");

  if (user) {
    // User is logged in
    loginButtons.forEach((btn) => (btn.style.display = "none"));
    logoutButtons.forEach((btn) => (btn.style.display = "block"));
    userProfileElements.forEach((el) => {
      el.style.display = "flex";
      // Update user name if the element exists
      const nameElement = el.querySelector(".user-name");
      if (nameElement) {
        nameElement.textContent = user.email.split("@")[0];
      }
    });
  } else {
    // User is logged out
    loginButtons.forEach((btn) => (btn.style.display = "block"));
    logoutButtons.forEach((btn) => (btn.style.display = "none"));
    userProfileElements.forEach((el) => (el.style.display = "none"));
  }
}

// Handle user logout
async function handleLogout(e) {
  e.preventDefault();
  await window.signOut();
}

// Load and display hotels on the homepage
async function loadAndDisplayHotels() {
  try {
    // Fetch hotels from Supabase
    const { data: hotels, error } = await window.supabase.from("hotels")
      .select(`
                *,
                ratings(rating)
            `);

    if (error) {
      console.error("Error fetching hotels:", error);
      // Fall back to sample hotels
      renderHotelList(window.sampleHotels);
      return;
    }

    if (hotels && hotels.length > 0) {
      // Process hotels to include average rating
      const processedHotels = hotels.map((hotel) => {
        // Calculate real average rating if ratings exist, otherwise set to 0
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
      // Fall back to sample hotels if no data returned
      // Ensure all sample hotels have an explicit rating
      const processedSampleHotels = window.sampleHotels.map((hotel) => ({
        ...hotel,
        rating: hotel.rating || 0,
        ratingCount: hotel.ratingCount || 0,
      }));
      renderHotelList(processedSampleHotels);
    }
  } catch (error) {
    console.error("Error in loadAndDisplayHotels:", error);
    // Ensure all sample hotels have an explicit rating
    const processedSampleHotels = window.sampleHotels.map((hotel) => ({
      ...hotel,
      rating: hotel.rating || 0,
      ratingCount: hotel.ratingCount || 0,
    }));
    renderHotelList(processedSampleHotels);
  }
}

// Display hotels in the UI
async function displayHotels(hotels) {
  try {
    // Get hotel ID from URL query parameters
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

    // Fetch hotel details
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

    // Format the price with the Saudi Riyal icon
    const formattedPrice = `<span class=\"icon-saudi_riyal\">&#xea;</span>${hotel.price}`;

    // Generate star rating HTML
    const ratingStars = window.generateStarRating
      ? window.generateStarRating(hotel.rating)
      : "";

    // Update the hotel details in the DOM
    document.getElementById("hotel-name").textContent = hotel.name;
    document.getElementById("hotel-location").textContent = hotel.location;
    document.getElementById("hotel-image").src = hotel.image;
    document.getElementById("hotel-image").alt = hotel.name;

    // Update hotel price
    const priceElement = document.getElementById("hotel-price");
    if (priceElement) {
      priceElement.innerHTML = `${formattedPrice}`;
    }

    // Update hotel rating
    const ratingElement = document.getElementById("hotel-rating");
    if (ratingElement) {
      ratingElement.innerHTML = ratingStars;
    }

    // Set up rating submission functionality
    setupRatingSubmission(hotelId);
  } catch (error) {
    console.error("Error in loadHotelDetails:", error);
  }
}

// Load hotel details
async function loadHotelDetails() {
  try {
    // Get hotel ID from URL query parameters
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

// Render hotel details in the UI
async function renderHotelDetails(hotelId) {
  try {
    // Fetch hotel details
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

    // Format the price with the Saudi Riyal icon
    const formattedPrice = `<span class=\"icon-saudi_riyal\">&#xea;</span>${hotel.price}`;

    // Generate star rating HTML
    const ratingStars = window.generateDetailStarRating(hotel.rating);

    // Update the hotel details in the DOM
    document.getElementById("hotel-name").textContent = hotel.name;
    document.getElementById("hotel-location").textContent = hotel.location;
    document.getElementById("hotel-image").src = hotel.image;
    document.getElementById("hotel-image").alt = hotel.name;

    // Update hotel price
    const priceElement = document.getElementById("hotel-price");
    if (priceElement) {
      priceElement.innerHTML = `${formattedPrice}`;
    }

    // Update hotel rating
    const ratingElement = document.getElementById("hotel-rating");
    if (ratingElement) {
      ratingElement.innerHTML = ratingStars;
    }

    // Set up rating submission functionality
    setupRatingSubmission(hotelId);
  } catch (error) {
    console.error("Error in renderHotelDetails:", error);
  }
}

// Setup rating submission functionality
function setupRatingSubmission(hotelId) {
  const ratingStars = document.querySelectorAll(".rating-star");
  const submitRatingButton = document.getElementById("submit-rating");

  if (!ratingStars.length || !submitRatingButton) return;

  let selectedRating = 0;

  // Handle star selection
  ratingStars.forEach((star, index) => {
    const ratingValue = index + 1;

    star.addEventListener("mouseover", () => {
      // Highlight stars on hover
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
      // Reset to selected rating on mouseout
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

      // Update visual state
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

  // Handle rating submission
  submitRatingButton.addEventListener("click", async () => {
    if (selectedRating === 0) {
      alert("Please select a rating before submitting");
      return;
    }

    try {
      const result = await window.submitHotelRating(hotelId, selectedRating);

      if (result.success) {
        alert(result.message);
        // Reload the page to see updated rating
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

// Setup authentication forms
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
          // Switch to login panel
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

// Hero text scroll and fade effect
function setupHeroTextEffect() {
  const heroHeading = document.getElementById("hero-heading");
  const heroSection = document.querySelector(".hero-section");
  if (!heroHeading || !heroSection) return;

  // Get the bottom position of the hero section relative to the viewport
  function getHeroSectionEnd() {
    const rect = heroSection.getBoundingClientRect();
    return rect.top + window.scrollY + rect.height;
  }

  window.addEventListener("scroll", () => {
    const sectionTop = heroSection.offsetTop;
    const sectionHeight = heroSection.offsetHeight;
    const scrollY = window.scrollY;
    // Calculate progress: 0 at top, 1 at bottom of hero section
    let progress = (scrollY - sectionTop) / sectionHeight;
    progress = Math.min(Math.max(progress, 0), 1);
    // Fade out and move down as you scroll through the hero section
    heroHeading.style.opacity = 1 - progress;
    heroHeading.style.transform = `translateY(${
      progress * sectionHeight * 0.5
    }px)`;
  });
}

// Setup hotel card scrolling with arrow buttons
function setupHotelCardScrolling() {
  const arrowLeft = document.getElementById("arrow-left");
  const arrowRight = document.getElementById("arrow-right");
  const hotelsContainer = document.getElementById("hotels-container");

  if (!arrowLeft || !arrowRight || !hotelsContainer) return;

  // Scroll left when left arrow is clicked
  arrowLeft.addEventListener("click", () => {
    hotelsContainer.scrollBy({
      left: -300,
      behavior: "smooth",
    });
  });

  // Scroll right when right arrow is clicked
  arrowRight.addEventListener("click", () => {
    hotelsContainer.scrollBy({
      left: 300,
      behavior: "smooth",
    });
  });
}

// Render hotel list in the UI
function renderHotelList(hotels) {
  const hotelsContainer = document.getElementById("hotels-container");
  if (!hotelsContainer) return;

  hotelsContainer.innerHTML = ""; // Clear existing content

  hotels.forEach((hotel) => {
    const card = document.createElement("div");
    card.className =
      "snap-start flex-shrink-0 w-80 sm:w-72 md:w-80 lg:w-96 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden";

    // Format the price with the Saudi Riyal icon
    const formattedPrice = `<span class="icon-saudi_riyal">&#xea;</span>${hotel.price}`;

    // Generate star rating
    const rating = hotel.rating || 0.0;
    const ratingStars = window.generateDetailStarRating(rating);

    // Determine the correct link based on login status
    const hotelLink = window.isLoggedIn
      ? `hotel-details.html?id=${hotel.id}`
      : `logindex.html`;

    card.innerHTML = `
      <div class="relative w-full h-48">
        <img src="${hotel.image}" alt="${hotel.name}" class="w-full h-full object-cover">
      </div>
      <div class="p-5">
        <h3 class="text-xl font-bold text-gray-800 mb-2">${hotel.name}</h3>
        <div class="flex items-center mb-2">
          <i class="bx bx-map text-gray-600 mr-1"></i>
          <span class="text-gray-600">${hotel.location}</span>
        </div>
        <div class="flex items-center text-amber-500 mb-4">
          ${ratingStars}
          <span class="ml-1 text-sm text-gray-600">(${rating})</span>
        </div>
        <div class="flex justify-between items-center">
          <div class="text-lg font-bold text-gray-800">${formattedPrice}<span class="text-sm font-medium text-gray-600"> /night</span></div>
          <a href="${hotelLink}" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">View Details</a>
        </div>
      </div>
    `;

    hotelsContainer.appendChild(card);
  });
}
