const sampleHotels = [
  {
    id: 1,
    name: "Lafa Luxury Hotel & Spa",
    location: "Riyadh, Saudi Arabia",
    price: 350,
    image: "media/exterior.jpg",
    rating: 4.8,
  },
  {
    id: 2,
    name: "Dar Aleiman Al Haram Hotel",
    location: "Medina, Saudi Arabia",
    price: 280,
    image: "media/Dar-Aleiman-Al-Haram-Hotel-Medina-Exterior.jpg",
    rating: 4.5,
  },
  {
    id: 3,
    name: "Royal Fountain Hotel",
    location: "Jeddah, Saudi Arabia",
    price: 320,
    image: "media/1641894785.jpg",
    rating: 4.7,
  },
  {
    id: 4,
    name: "Grand Oasis Resort",
    location: "Dammam, Saudi Arabia",
    price: 290,
    image: "media/869918c9da63b2c5685fce05965700da5b0e6617.jpg",
    rating: 4.6,
  },
];

window.isLoggedIn = false;
window.userAvatarUrl = null;

async function checkUser(requireAuth = false) {
  try {
    const {
      data: { session },
      error,
    } = await window.supabase.auth.getSession();
    if (error) {
      console.error(error);
      window.isLoggedIn = false;
      return null;
    }
    if (!session?.user) {
      window.isLoggedIn = false;
      if (requireAuth) window.location.href = "logindex.html";
      return null;
    }
    window.isLoggedIn = true;
    await loadUserAvatar(session.user.id);
    return session.user;
  } catch (error) {
    console.error(error);
    window.isLoggedIn = false;
    return null;
  }
}

async function loadUserAvatar(userId) {
  try {
    const { data: profile, error } = await window.supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();
    if (error || !profile) {
      console.error(error);
      window.userAvatarUrl = null;
      return null;
    }
    window.userAvatarUrl = profile.avatar_url || null;
    return window.userAvatarUrl;
  } catch (error) {
    console.error(error);
    window.userAvatarUrl = null;
    return null;
  }
}

async function getUserProfile(userId) {
  try {
    const { data: profile, error } = await window.supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      console.error(error);
      return null;
    }
    return profile;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function updateUserAvatar(userId, avatarUrl) {
  try {
    const { error } = await window.supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
    window.userAvatarUrl = avatarUrl;
    return {
      success: true,
      message: avatarUrl
        ? "Avatar updated successfully"
        : "Avatar removed successfully",
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

async function updateAvatar(avatarUrl) {
  try {
    const user = await checkUser();
    if (!user) throw new Error("You must be logged in to update your avatar");
    const result = await updateUserAvatar(user.id, avatarUrl);
    if (result.success) {
      const avatarImg = document.getElementById("profile-avatar");
      const placeholder = document.getElementById("avatar-placeholder");
      if (avatarImg && placeholder) {
        if (avatarUrl) {
          avatarImg.src = avatarUrl;
          avatarImg.classList.remove("hidden");
          placeholder.classList.add("hidden");
        } else {
          avatarImg.classList.add("hidden");
          placeholder.classList.remove("hidden");
          placeholder.classList.add("pulse-animation");
        }
      }
      window.userAvatarUrl = avatarUrl;
      return true;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob), file.type, 0.7);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

function showStatus(type, message) {
  const statusElement = document.getElementById("file-upload-status");
  if (!statusElement) return;
  statusElement.textContent = message;
  switch (type) {
    case "success":
      statusElement.style.color = "#a3e635";
      break;
    case "error":
      statusElement.style.color = "#f87171";
      break;
    case "info":
    default:
      statusElement.style.color = "#ffffff";
      break;
  }
  setTimeout(() => {
    statusElement.textContent = "";
  }, 3000);
}

async function loadProfileData(user) {
  try {
    const profile = await getUserProfile(user.id);
    if (!profile) {
      showStatus("error", "Could not load profile data");
      return;
    }
    const usernameElement = document.getElementById("profile-username");
    const emailElement = document.getElementById("profile-email");
    if (usernameElement)
      usernameElement.textContent = profile.username || "Username not set";
    if (emailElement)
      emailElement.textContent =
        profile.email || user.email || "Email not available";
    const avatarImg = document.getElementById("profile-avatar");
    const placeholder = document.getElementById("avatar-placeholder");
    if (avatarImg && placeholder) {
      if (profile.avatar_url) {
        avatarImg.src = profile.avatar_url;
        avatarImg.classList.remove("hidden");
        placeholder.classList.add("hidden");
      } else {
        avatarImg.classList.add("hidden");
        placeholder.classList.remove("hidden");
      }
    }
  } catch (error) {
    console.error(error);
    showStatus("error", "Error loading profile data");
  }
}

async function signIn(email, password) {
  try {
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { success: false, message: error.message };
    return { success: true, data: data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

async function signUp(email, password, username) {
  try {
    if (username.length < 3)
      return {
        success: false,
        message: "Username must be at least 3 characters long",
      };
    const { data: existingUser, error: checkError } = await window.supabase
      .from("profiles")
      .select("username")
      .eq("username", username)
      .maybeSingle();
    if (checkError)
      return {
        success: false,
        message: "Error checking username availability",
      };
    if (existingUser)
      return {
        success: false,
        message: "Username already taken",
        code: "USERNAME_TAKEN",
      };
    const { data: authData, error: authError } =
      await window.supabase.auth.signUp({ email, password });
    if (authError) return { success: false, message: authError.message };
    const sessionCheck = await window.supabase.auth.getSession();
    const session = sessionCheck.data.session;
    if (!session)
      return {
        success: true,
        message:
          "Account created! Please check your email to confirm before proceeding.",
      };
    const userId = session.user.id;
    const { error: usernameUpdateError } = await window.supabase
      .from("profiles")
      .update({ username })
      .eq("id", userId);
    if (usernameUpdateError)
      return {
        success: false,
        message: "Profile created, but setting username failed.",
      };
    return { success: true, data: authData };
  } catch (error) {
    return { success: false, message: error.message || "Unexpected error" };
  }
}

async function signOut() {
  try {
    const { error } = await window.supabase.auth.signOut();
    if (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
    window.location.href = "logindex.html";
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

async function getHotelById(hotelId) {
  try {
    const { data, error } = await window.supabase
      .from("hotels")
      .select(`*, ratings(rating)`)
      .eq("id", hotelId)
      .single();
    if (error) {
      console.error(error);
      return null;
    }
    if (data) {
      const hotel = {
        ...data,
        rating:
          data.ratings?.length > 0
            ? data.ratings.reduce((sum, r) => sum + r.rating, 0) /
              data.ratings.length
            : 0.0,
        totalRatings: data.ratings?.length || 0,
      };
      return hotel;
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function submitHotelRating(hotelId, rating) {
  try {
    if (!window.supabase)
      return {
        success: false,
        message: "Error: Database connection not available",
      };
    const user = await checkUser();
    if (!user)
      return { success: false, message: "Please login to rate hotels" };
    const { data: existingRating, error: fetchError } = await window.supabase
      .from("ratings")
      .select("id")
      .eq("user_id", user.id)
      .eq("hotel_id", parseInt(hotelId))
      .limit(1);
    if (fetchError) {
      console.error(fetchError);
      return { success: false, message: "Failed to check existing rating" };
    }
    if (isNaN(rating) || rating < 1 || rating > 5)
      return { success: false, message: "Rating must be between 1 and 5" };
    let result;
    if (existingRating && existingRating.length > 0) {
      result = await window.supabase
        .from("ratings")
        .update({ rating: rating })
        .eq("id", existingRating[0].id);
      if (result.error) {
        console.error(result.error);
        return { success: false, message: "Failed to update your rating" };
      }
      return { success: true, message: "Your rating has been updated" };
    } else {
      result = await window.supabase
        .from("ratings")
        .insert({
          user_id: user.id,
          hotel_id: parseInt(hotelId),
          rating: rating,
        });
      if (result.error) {
        console.error(result.error);
        return { success: false, message: "Failed to add your rating" };
      }
      return { success: true, message: "Your rating has been submitted" };
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "An error occurred while submitting your rating",
    };
  }
}

async function submitComment(hotelId, comment, rating) {
  try {
    if (!window.supabase)
      return {
        success: false,
        message: "Error: Database connection not available",
      };
    const user = await checkUser();
    if (!user) return { success: false, message: "Please login to comment" };
    const { data: existingRating, error: fetchError } = await window.supabase
      .from("ratings")
      .select("id, comment")
      .eq("user_id", user.id)
      .eq("hotel_id", parseInt(hotelId))
      .limit(1);
    if (fetchError) {
      console.error(fetchError);
      return { success: false, message: "Failed to check existing comment" };
    }
    let result;
    const validRating =
      rating && !isNaN(rating) && rating >= 1 && rating <= 5
        ? rating
        : existingRating && existingRating.length > 0
        ? existingRating[0].rating
        : 5;
    if (existingRating && existingRating.length > 0) {
      result = await window.supabase
        .from("ratings")
        .update({ comment: comment, rating: validRating })
        .eq("id", existingRating[0].id);
      if (result.error) {
        console.error(result.error);
        return { success: false, message: "Failed to update your comment" };
      }
      return {
        success: true,
        message: "Your comment and rating have been updated",
      };
    } else {
      result = await window.supabase
        .from("ratings")
        .insert({
          user_id: user.id,
          hotel_id: parseInt(hotelId),
          comment: comment,
          rating: validRating,
        });
      if (result.error) {
        console.error(result.error);
        return { success: false, message: "Failed to add your comment" };
      }
      return { success: true, message: "Your comment has been submitted" };
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "An error occurred while submitting your comment",
    };
  }
}

async function fetchHotelComments(hotelId) {
  try {
    const { data, error } = await window.supabase
      .from("ratings")
      .select("comment, created_at, user_id, rating")
      .eq("hotel_id", parseInt(hotelId))
      .not("comment", "is", null)
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function uploadHotelImage(file, hotelId, isMain = false) {
  try {
    const compressedImageBlob = await compressImage(file);
    const compressedFile = new File([compressedImageBlob], file.name, {
      type: file.type,
    });
    const path = isMain
      ? `${hotelId}/main.jpg`
      : `${hotelId}/sub/${Date.now()}.jpg`;
    const { data, error } = await window.supabase.storage
      .from("hotel-image")
      .upload(path, compressedFile, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });
    if (error) throw error;
    const { data: urlData } = window.supabase.storage
      .from("hotel-image")
      .getPublicUrl(path);
    return urlData.publicUrl;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function saveMainImageUrl(hotelId, imageUrl) {
  try {
    const { error } = await window.supabase
      .from("hotels")
      .update({ main_image_url: imageUrl })
      .eq("id", hotelId);
    if (error) {
      console.error(error);
      return { success: false, message: "Failed to save main image URL" };
    }
    return { success: true, message: "Main image URL saved successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

async function saveSubImageUrl(hotelId, imageUrl) {
  try {
    const { error } = await window.supabase
      .from("hotel_images")
      .insert([{ hotel_id: hotelId, image_url: imageUrl }]);
    if (error) {
      console.error(error);
      return { success: false, message: "Failed to save sub-image URL" };
    }
    return { success: true, message: "Sub-image URL saved successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

async function deleteHotelImage(path, removeFromDb = false, imageUrl = null) {
  try {
    const { error } = await window.supabase.storage
      .from("hotel-image")
      .remove([path]);
    if (error) {
      console.error(error);
      return { success: false, message: "Failed to delete image from storage" };
    }
    if (removeFromDb && imageUrl) {
      if (path.includes("/main.jpg")) {
        const hotelId = path.split("/")[0];
        const { error: dbError } = await window.supabase
          .from("hotels")
          .update({ main_image_url: null })
          .eq("id", hotelId);
        if (dbError) {
          console.error(dbError);
          return {
            success: false,
            message: "Image deleted from storage but failed to update database",
          };
        }
      } else {
        const { error: dbError } = await window.supabase
          .from("hotel_images")
          .delete()
          .eq("image_url", imageUrl);
        if (dbError) {
          console.error(dbError);
          return {
            success: false,
            message: "Image deleted from storage but failed to update database",
          };
        }
      }
    }
    return { success: true, message: "Image deleted successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

async function getHotelSubImages(hotelId) {
  try {
    const { data, error } = await window.supabase
      .from("hotel_images")
      .select("*")
      .eq("hotel_id", hotelId);
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function getHotelAdditionalImages(hotelId) {
  try {
    const { data, error } = await window.supabase
      .from("hotel_images")
      .select("id, image_url")
      .eq("hotel_id", hotelId)
      .eq("is_main", false);
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function deleteAllHotelImages(hotelId) {
  try {
    const { data, error } = await window.supabase.storage
      .from("hotel-image")
      .list(`${hotelId}`);
    if (error) {
      console.error(error);
      return { success: false, message: "Failed to list hotel images" };
    }
    if (data && data.length > 0) {
      const filePaths = data.map((file) => `${hotelId}/${file.name}`);
      const { error: deleteError } = await window.supabase.storage
        .from("hotel-image")
        .remove(filePaths);
      if (deleteError) {
        console.error(deleteError);
        return {
          success: false,
          message: "Failed to delete some hotel images",
        };
      }
    }
    const { data: subData, error: subError } = await window.supabase.storage
      .from("hotel-image")
      .list(`${hotelId}/sub`);
    if (!subError && subData && subData.length > 0) {
      const subFilePaths = subData.map((file) => `${hotelId}/sub/${file.name}`);
      await window.supabase.storage.from("hotel-image").remove(subFilePaths);
    }
    return { success: true, message: "All hotel images deleted successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

async function getHotelMainImage(hotelId) {
  try {
    const { data, error } = await window.supabase
      .from("hotel_images")
      .select("image_url")
      .eq("hotel_id", hotelId)
      .eq("is_main", true)
      .single();
    if (error) {
      console.error(error);
      return null;
    }
    return data?.image_url || null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function loadHotelData() {
  try {
    const user = await checkUser(true);
    if (!user) return [];
    const loadingElement = document.getElementById("loading");
    const noHotelsElement = document.getElementById("no-hotels");
    const hotelsGridElement = document.getElementById("hotels-grid");
    if (loadingElement) loadingElement.classList.remove("hidden");
    if (noHotelsElement) noHotelsElement.classList.add("hidden");
    if (hotelsGridElement) hotelsGridElement.classList.add("hidden");
    const { data: hotels, error } = await window.supabase
      .from("hotels")
      .select("*")
      .eq("owner_id", user.id);
    if (loadingElement) loadingElement.classList.add("hidden");
    if (error) {
      console.error(error);
      return [];
    }
    if (hotels && hotels.length > 0) {
      if (hotelsGridElement) {
        hotelsGridElement.innerHTML = "";
        for (const hotel of hotels) {
          const mainImageUrl = await getHotelMainImage(hotel.id);
          hotel.image = mainImageUrl;
          const hotelCard = createHotelCard(hotel);
          hotelsGridElement.appendChild(hotelCard);
        }
        hotelsGridElement.classList.remove("hidden");
      }
    } else {
      if (noHotelsElement) noHotelsElement.classList.remove("hidden");
    }
    return hotels || [];
  } catch (error) {
    console.error(error);
    const loadingElement = document.getElementById("loading");
    if (loadingElement) loadingElement.classList.add("hidden");
    return [];
  }
}

function createHotelCard(hotel) {
  const card = document.createElement("div");
  card.className =
    "hotel-card bg-white rounded-lg shadow-md overflow-hidden cursor-pointer";
  card.dataset.hotelId = hotel.id;
  const imageUrl = hotel.image || "media/placeholder-hotel.jpg";
  card.innerHTML = `
    <div class="relative h-48">
      <img src="${imageUrl}" alt="${
    hotel.name
  }" class="w-full h-full object-cover" id="hotel-main-image-${hotel.id}">
      <div class="absolute top-2 right-2">
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-gray-800">
          <i class="bx bxs-star text-yellow-500 mr-1"></i>${hotel.rating || 0}
        </span>
      </div>
    </div>
    <div class="p-4">
      <h3 class="font-bold text-gray-800">${hotel.name}</h3>
      <p class="text-gray-600 text-sm mb-2">
        <i class="bx bx-map text-gray-400 mr-1"></i>${hotel.location}
      </p>
      <div class="flex justify-between items-center mt-2">
        <p class="text-purple-600 font-medium">SAR ${
          hotel.price || 0
        } / night</p>
        <button class="edit-hotel-btn text-sm text-gray-500 hover:text-purple-600">
          <i class="bx bx-edit"></i> Edit
        </button>
      </div>
      <div class="mt-3 pt-3 border-t border-gray-100">
        <div id="hotel-sub-images-${
          hotel.id
        }" class="flex overflow-x-auto pb-2"></div>
        <label for="sub-image-upload-${
          hotel.id
        }" class="mt-2 inline-block cursor-pointer text-xs text-purple-600 hover:text-purple-700">
          <i class="bx bx-plus"></i> Add Images
        </label>
        <input type="file" id="sub-image-upload-${
          hotel.id
        }" class="hidden" accept="image/*" multiple>
      </div>
    </div>
  `;
  card.addEventListener("click", (e) => {
    if (
      e.target.closest(".edit-hotel-btn") ||
      e.target.closest('input[type="file"]')
    )
      return;
    showEditHotelForm(hotel);
  });
  const editBtn = card.querySelector(".edit-hotel-btn");
  if (editBtn)
    editBtn.addEventListener("click", () => showEditHotelForm(hotel));
  return card;
}

function showEditHotelForm(hotel) {
  const listSection = document.getElementById("hotels-list-section");
  const formSection = document.getElementById("hotel-form-section");
  const formTitle = document.getElementById("form-title");
  if (listSection) listSection.classList.add("hidden");
  if (formSection) formSection.classList.remove("hidden");
  if (formTitle) formTitle.textContent = "Edit Hotel";
  document.getElementById("hotel-id").value = hotel.id;
  document.getElementById("hotel-name").value = hotel.name || "";
  document.getElementById("hotel-location").value = hotel.location || "";
  document.getElementById("hotel-price").value = hotel.price || "";
  document.getElementById("hotel-description").value = hotel.description || "";
  document.getElementById("hotel-main-image").value = hotel.image || "";
  const mainImagePreview = document.getElementById("main-image-preview");
  const mainImagePreviewContainer = document.getElementById(
    "main-image-preview-container"
  );
  const mainImageUpload = document.getElementById("main-image-upload");
  if (hotel.image) {
    mainImagePreview.src = hotel.image;
    mainImagePreviewContainer.classList.remove("hidden");
    mainImageUpload.classList.add("hidden");
  } else {
    mainImagePreviewContainer.classList.add("hidden");
    mainImageUpload.classList.remove("hidden");
  }
  document.getElementById("submit-btn-text").textContent = "Update Hotel";
}

async function displayHotels(hotels) {
  if (!hotels || hotels.length === 0) {
    document.getElementById("hotels-container").innerHTML = `
      <div class="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 flex justify-center">
        <div class="text-center p-8">
          <p class="text-lg text-gray-600">No hotels found</p>
        </div>
      </div>
    `;
    return;
  }
  const hotelsContainer = document.getElementById("hotels-container");
  hotelsContainer.innerHTML = "";
  for (const hotel of hotels) {
    const mainImageUrl = await getHotelMainImage(hotel.id);
    const card = document.createElement("div");
    card.className =
      "snap-start flex-shrink-0 w-80 sm:w-72 md:w-80 lg:w-96 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden";
    const formattedPrice = `<span class="icon-saudi_riyal">&#xea;</span>${hotel.price}`;
    const ratingValue =
      hotel.rating === null || hotel.rating === undefined || isNaN(hotel.rating)
        ? 0.0
        : hotel.rating;
    const totalRatings =
      hotel.totalRatings !== undefined
        ? hotel.totalRatings
        : hotel.ratings
        ? hotel.ratings.length
        : 0;
    const starsHtml = generateDetailStarRating(ratingValue);
    card.innerHTML = `
      <div class="relative w-full h-48">
        <img src="${mainImageUrl || "media/placeholder-hotel.jpg"}" alt="${
      hotel.name
    }" class="w-full h-full object-cover">
      </div>
      <div class="p-5">
        <h3 class="text-xl font-bold text-gray-800 mb-2">${hotel.name}</h3>
        <div class="flex items-center mb-2">
          <i class="bx bx-map text-gray-600 mr-1"></i>
          <span class="text-gray-600">${hotel.location}</span>
        </div>
        <div class="flex items-center mb-4">
          <span class="text-lg font-bold text-gray-800 mr-2">${Number(
            ratingValue
          ).toFixed(1)}</span>
          <div class="flex items-center text-amber-500">${starsHtml}</div>
          <span class="ml-2 text-sm text-gray-600">(${totalRatings})</span>
        </div>
        <div class="flex justify-between items-center">
          <div class="text-lg font-bold text-gray-800">${formattedPrice}<span class="text-sm font-medium text-gray-600"> /night</span></div>
          <a href="hotel-details.html?id=${
            hotel.id
          }" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">View Details</a>
        </div>
      </div>
    `;
    hotelsContainer.appendChild(card);
  }
}

function generateDetailStarRating(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  let starsHtml = "";
  if (Number(rating) === 0) {
    for (let i = 0; i < 5; i++) {
      starsHtml += `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"#CBD5E0\" class=\"text-gray-300\"><path d=\"M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z\"/></svg>`;
    }
    return starsHtml;
  }
  for (let i = 0; i < fullStars; i++) {
    starsHtml += `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"currentColor\" class=\"text-yellow-500\"><path d=\"M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z\"/></svg>`;
  }
  if (hasHalfStar) {
    starsHtml += `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" class=\"text-yellow-500\"><defs><linearGradient id=\"half-${rating}\"><stop offset=\"50%\" stop-color=\"currentColor\" /><stop offset=\"50%\" stop-color=\"#CBD5E0\" /></linearGradient></defs><path d=\"M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z\" fill=\"url(#half-${rating})\"/></svg>`;
  }
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"#CBD5E0\" class=\"text-gray-300\"><path d=\"M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z\"/></svg>`;
  }
  return starsHtml;
}

async function initializeStorage() {
  try {
    try {
      const { data, error } = await window.supabase.storage
        .from("hotel-image")
        .list();
      if (error) {
        const { data: newBucket, error: createError } =
          await window.supabase.storage.createBucket("hotel-image", {
            public: true,
            fileSizeLimit: 10485760,
          });
        if (createError) return false;
        else return true;
      } else return true;
    } catch (listError) {
      console.error(listError);
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const storageInitialized = await initializeStorage();
  console.log(storageInitialized);
});

window.checkUser = checkUser;
window.signIn = signIn;
window.signUp = signUp;
window.signOut = signOut;
window.getHotelById = getHotelById;
window.submitHotelRating = submitHotelRating;
window.submitComment = submitComment;
window.fetchHotelComments = fetchHotelComments;
window.displayHotels = displayHotels;
window.sampleHotels = sampleHotels;
window.getUserProfile = getUserProfile;
window.updateUserAvatar = updateUserAvatar;
window.updateAvatar = updateAvatar;
window.compressImage = compressImage;
window.showStatus = showStatus;
window.loadProfileData = loadProfileData;
window.uploadHotelImage = uploadHotelImage;
window.saveMainImageUrl = saveMainImageUrl;
window.saveSubImageUrl = saveSubImageUrl;
window.deleteHotelImage = deleteHotelImage;
window.deleteAllHotelImages = deleteAllHotelImages;
window.getHotelSubImages = getHotelSubImages;
window.loadHotelData = loadHotelData;
window.initializeStorage = initializeStorage;
window.getHotelMainImage = getHotelMainImage;
window.getHotelAdditionalImages = getHotelAdditionalImages;
