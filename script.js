// Sample hotel data
const hotels = [
  {
    id: 1,
    name: "Four Seasons Hotel",
    location: "Riadh, Saudi Arabia",
    rating: 4.8,
    price: 399,
    imageUrl:
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/113857950.jpg?k=93e381e54edcf9147ff2dc5664e869daa49e68d515cc793afb16ba28690f50e3&o=&hp=1",
  },
  {
    id: 2,
    name: "Garden Hotel",
    location: "Abha, Saudi Arabia",
    rating: 4.7,
    price: 249,
    imageUrl:
      "https://content.skyscnr.com/available/2006082616/2006082616_576x576.jpg",
  },
  {
    id: 3,
    name: "Al Safwah Royale Orchid",
    location: "Makkah, Saudi Arabia",
    rating: 4.9,
    price: 249,
    imageUrl:
      "https://content.r9cdn.net/rimg/himg/e2/9a/e9/expedia_group-624030-48b3deb2-422603.jpg?width=1366&height=768&crop=true",
  },
  {
    id: 4,
    name: "Anwar Al Madinah Mövenpick",
    location: "Medina, Saudi Arabia",
    rating: 4.6,
    price: 379,
    imageUrl:
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/592320119.jpg?k=7a097dc46180dbe972c76d58e01c5acd91e20b372c63f22fffde0497b62c5492&o=&hp=1",
  },
  {
    id: 5,
    name: "Le Meridien Bali Jimbaran",
    location: "Bali, Indonesia",
    rating: 4.8,
    price: 459,
    imageUrl:
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/590120309.jpg?k=0b2ee72b873eb00ad066e5cb7d6301c98f62cb86058e99d802d3a0e84f377e3f&o=&hp=1",
  },
  {
    id: 6,
    name: "Hilton Suites Makkah",
    location: "Makkah, Saudi Arabia",
    rating: 4.7,
    price: 429,
    imageUrl:
      "https://www.il.kayak.com/rimg/himg/01/49/5b/ice-2844332-99756697-185877.jpg?width=1366&height=768&crop=true",
  },
  {
    id: 7,
    name: "Raffles Makkah Palace",
    location: "Makkah, Saudi Arabia",
    rating: 5.0,
    price: 599,
    imageUrl:
      "https://q-xx.bstatic.com/xdata/images/hotel/max500/659374508.jpg?k=7baffca72e394e4a6d35415926c61252d447c59960a0a8aabe92896f9e07a72d&o=",
  },
  {
    id: 16,
    name: "Parisian Elegance Hotel",
    location: "Paris, France",
    rating: 4.8,
    price: 799,
    imageUrl:
      "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg",
  },
  {
    id: 17,
    name: "Tokyo Skyline Suites",
    location: "Tokyo, Japan",
    rating: 4.9,
    price: 899,
    imageUrl:
      "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg",
  },
  {
    id: 18,
    name: "Sydney Harbour Retreat",
    location: "Sydney, Australia",
    rating: 4.7,
    price: 699,
    imageUrl:
      "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg",
  },
  {
    id: 19,
    name: "Cape Town Luxury Lodge",
    location: "Cape Town, South Africa",
    rating: 4.8,
    price: 649,
    imageUrl:
      "https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg",
  },
];

// Create dynamic star rating HTML
function createStarRating(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  let starsHtml = "";

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    starsHtml += `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="text-yellow-500">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
    </svg>`;
  }

  // Half star if needed
  if (hasHalfStar) {
    starsHtml += `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" class="text-yellow-500">
      <defs>
        <linearGradient id="half-${rating}">
          <stop offset="50%" stop-color="currentColor" />
          <stop offset="50%" stop-color="#CBD5E0" />
        </linearGradient>
      </defs>
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="url(#half-${rating})"/>
    </svg>`;
  }

  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#CBD5E0" class="text-gray-300">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
    </svg>`;
  }

  return starsHtml;
}

// Create hotel cards with horizontal scroll
function createHotelCards() {
  const container = document.querySelector(".hotel-container");
  if (!container) return;

  hotels.forEach((hotel, index) => {
    const card = document.createElement("div");
    card.className =
      "hotel-card snap-center min-w-[300px] md:min-w-[350px] flex-shrink-0 mx-2";
    card.style.animation = `fadeIn 0.6s ease-in forwards ${index * 0.2}s`;

    card.innerHTML = `
      <div class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="relative h-48 overflow-hidden">
          <img src="${hotel.imageUrl}" alt="${
      hotel.name
    }" class="w-full h-full object-cover">
        </div>
        <div class="p-5">
          <h3 class="text-xl font-semibold text-gray-800 mb-2">${
            hotel.name
          }</h3>
          <div class="flex items-center space-x-1 mb-4">
            <div class="flex items-center bg-yellow-100 px-2 py-1 rounded text-sm">
              <span class="font-medium">${hotel.rating}</span>
            </div>
            ${createStarRating(hotel.rating)}
          </div>
          <div class="flex items-center text-gray-600 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="mr-1">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span class="text-sm">${hotel.location}</span>
          </div>
          <div class="flex items-center justify-between mt-4">
            <div class="flex flex-col">
              <span class="text-2xl font-bold text-gray-800">$${
                hotel.price
              }</span>
              <span class="text-sm text-gray-500">per night</span>
            </div>
            <button class="px-4 py-2 bg-purple-500 text-white rounded-2xl hover:bg-purple-600 transition-colors duration-300">
              Book Now
            </button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  // Add scroll buttons
  const scrollLeftBtn = document.createElement("button");
  scrollLeftBtn.className = "scroll-btn left-2";
  scrollLeftBtn.innerHTML = "◀";

  const scrollRightBtn = document.createElement("button");
  scrollRightBtn.className = "scroll-btn right-2";
  scrollRightBtn.innerHTML = "▶";

  const scrollWrapper = container.parentElement;
  if (scrollWrapper) {
    scrollWrapper.appendChild(scrollLeftBtn);
    scrollWrapper.appendChild(scrollRightBtn);

    scrollLeftBtn.addEventListener("click", () => {
      container.scrollBy({ left: -300, behavior: "smooth" });
    });

    scrollRightBtn.addEventListener("click", () => {
      container.scrollBy({ left: 300, behavior: "smooth" });
    });
  }
}

// Add scroll effect to header and hero text
window.addEventListener("scroll", () => {
  const header = document.querySelector("header");
  const heroText = document.querySelector("#hero-text");
  const gradientOverlay = document.querySelector(".bg-gradient-to-b");
  const scrolled = window.scrollY;

  // Header effects
  if (scrolled > 10) {
    header.classList.remove("bg-transparent", "pt-6");
    header.classList.add("bg-white/90", "backdrop-blur-sm", "shadow-md");
  } else {
    header.classList.add("bg-transparent", "pt-6");
    header.classList.remove("bg-white/90", "backdrop-blur-sm", "shadow-md");
  }

  // Update text color and button styles based on scroll position
  const headerText = header.querySelector("span");
  const desktopLoginButton = header.querySelector("nav a[href='/login']");
  const mobileLoginButton = header.querySelector(
    "a[href='/login'].md\\:hidden"
  );

  if (scrolled > 10) {
    headerText.classList.remove("text-white");
    headerText.classList.add("text-purple-600");

    // Desktop button
    if (desktopLoginButton) {
      desktopLoginButton.classList.remove("bg-purple-500");
      desktopLoginButton.classList.add("bg-purple-600");
    }

    // Mobile button
    if (mobileLoginButton) {
      mobileLoginButton.classList.remove("bg-purple-500");
      mobileLoginButton.classList.add("bg-purple-600");
    }
  } else {
    headerText.classList.add("text-white");
    headerText.classList.remove("text-purple-600");

    // Desktop button
    if (desktopLoginButton) {
      desktopLoginButton.classList.add("bg-purple-500");
      desktopLoginButton.classList.remove("bg-purple-600");
    }

    // Mobile button
    if (mobileLoginButton) {
      mobileLoginButton.classList.add("bg-purple-500");
      mobileLoginButton.classList.remove("bg-purple-600");
    }
  }

  // Hero text animation
  if (heroText && gradientOverlay) {
    const gradientBottom = gradientOverlay.getBoundingClientRect().bottom;
    const maxScroll = window.innerHeight * 0.7; // 70% of viewport height
    const scrollPercent = Math.min(scrolled / maxScroll, 1);

    // Calculate translation based on scroll position
    const translateY = Math.min(scrolled * 0.5, gradientBottom); // Move at half the scroll speed

    // Apply the transform
    heroText.style.transform = `translateY(${translateY}px)`;

    // Fade out as it reaches the gradient end
    if (translateY >= gradientBottom - 200) {
      // Start fading 200px before gradient end
      const fadePercent = (gradientBottom - translateY) / 200;
      heroText.style.opacity = Math.max(fadePercent, 0);
    } else {
      heroText.style.opacity = 1;
    }
  }
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  createHotelCards();
});
