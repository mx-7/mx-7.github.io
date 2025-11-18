window.isLoggedIn = false;
window.userAvatarUrl = null;

async function checkUser(redirectWhenLoggedOut = true) {
  try {
    const {
      data: { user },
    } = await window.supabase.auth.getUser();

    window.isLoggedIn = !!user;

    if (user) {
      // Get the user's profile data including avatar_url
      const { data: profileData, error: profileError } = await window.supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else if (profileData) {
        // Save avatar URL to window object
        window.userAvatarUrl = profileData.avatar_url;
        window.userName = profileData.full_name || user.email;
      }

      return user;
    } else if (redirectWhenLoggedOut) {
      window.location.href = "logindex.html";
      return null;
    }

    return null;
  } catch (error) {
    console.error("Error checking authentication", error);
    return null;
  }
}

// Helper function to fetch the avatar URL directly when needed
window.getAvatarUrl = async (userId) => {
  try {
    const { data, error } = await window.supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data?.avatar_url;
  } catch (error) {
    console.error("Error fetching avatar:", error);
    return null;
  }
};

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
    console.log("[updateUserAvatar] Updating avatar for user:", userId, "URL:", avatarUrl);
    
    const { error } = await window.supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq("id", userId);
    
    if (error) {
      console.error("[updateUserAvatar] Database error:", error);
      console.error("[updateUserAvatar] Error details:", {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details,
      });
      return { success: false, message: error.message };
    }

    console.log("[updateUserAvatar] Update successful");

    // Add cache-busting to prevent old images from showing
    window.userAvatarUrl = avatarUrl
      ? avatarUrl + "?t=" + new Date().getTime()
      : null;

    return {
      success: true,
      message: avatarUrl
        ? "Avatar updated successfully"
        : "Avatar removed successfully",
    };
  } catch (error) {
    console.error("[updateUserAvatar] Exception:", error);
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
          // Add cache-busting query parameter
          const cacheBustedUrl = avatarUrl + "?t=" + new Date().getTime();
          avatarImg.src = cacheBustedUrl;
          avatarImg.classList.remove("hidden");
          placeholder.classList.add("hidden");
        } else {
          avatarImg.classList.add("hidden");
          placeholder.classList.remove("hidden");
          placeholder.classList.add("pulse-animation");
        }
      }
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
      result = await window.supabase.from("ratings").insert({
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
      result = await window.supabase.from("ratings").insert({
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

async function uploadHotelImage(file, hotelId, isMain = false, hotelName = null) {
  try {
    const compressedImageBlob = await compressImage(file);
    const compressedFile = new File([compressedImageBlob], file.name, {
      type: file.type,
    });
    
    // Use hotel name as folder if provided, otherwise use hotelId
    const folderName = hotelName ? hotelName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : hotelId;
    
    // Organized path structure: {folderName}/main.jpg or {folderName}/sub/{timestamp}.jpg
    const path = isMain
      ? `${folderName}/main.jpg`
      : `${folderName}/sub/${Date.now()}.jpg`;
    console.log("Uploading to path:", path);
    const { data, error } = await window.supabase.storage
      .from("hotel-image")
      .upload(path, compressedFile, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });
    if (error) throw error;
    console.log("Upload successful:", data);
    const { data: urlData } = window.supabase.storage
      .from("hotel-image")
      .getPublicUrl(path);
    console.log("Public URL:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
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
      .limit(1);
    if (error) {
      console.error(error);
      return null;
    }
    return data && data.length > 0 ? data[0].image_url : null;
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

    // Fetch hotels with ratings data
    const { data: hotels, error } = await window.supabase
      .from("hotels")
      .select(`*, ratings(rating)`)
      .eq("owner_id", user.id);

    if (loadingElement) loadingElement.classList.add("hidden");
    if (error) {
      console.error(error);
      return [];
    }

    if (hotels && hotels.length > 0) {
      if (hotelsGridElement) {
        hotelsGridElement.innerHTML = "";
        
        // Fetch all main images at once
        const { data: images, error: imgError } = await window.supabase
          .from("hotel_images")
          .select("hotel_id, image_url")
          .eq("is_main", true);
        
        // Create a map of hotel_id -> image_url for quick lookup
        const imageMap = {};
        if (images) {
          images.forEach(img => {
            imageMap[img.hotel_id] = img.image_url;
          });
        }
        
        for (const hotel of hotels) {
          // Get image from map instead of individual query
          const mainImageUrl = imageMap[hotel.id] || null;

          // Calculate average rating and count
          hotel.image = mainImageUrl;
          hotel.rating =
            hotel.ratings && hotel.ratings.length > 0
              ? hotel.ratings.reduce((sum, r) => sum + r.rating, 0) /
                hotel.ratings.length
              : 0.0;
          hotel.totalRatings = hotel.ratings ? hotel.ratings.length : 0;

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
  return createDishCardComponent(hotel, (hotelData) => {
    showEditHotelForm(hotelData);
  });
}

function showEditHotelForm(hotel) {
  const listSection = document.getElementById("hotels-list-section");
  const formSection = document.getElementById("hotel-form-section");
  const formTitle = document.getElementById("form-title");
  if (listSection) listSection.classList.add("hidden");
  if (formSection) formSection.classList.remove("hidden");
  if (formTitle) formTitle.textContent = "Edit Dish";
  document.getElementById("hotel-id").value = hotel.id;
  document.getElementById("hotel-name").value = hotel.name || "";
  document.getElementById("hotel-location").value = hotel.description || "";
  document.getElementById("hotel-price").value = hotel.price || "";
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
  document.getElementById("submit-btn-text").textContent = "Update Dish";
  
  // Load sub-images
  loadHotelSubImagesForEdit(hotel.id);
}

async function loadHotelSubImagesForEdit(hotelId) {
  try {
    const subImages = await getHotelSubImages(hotelId);
    const subImagesContainer = document.getElementById("sub-images-container");
    if (!subImagesContainer) return;
    subImagesContainer.innerHTML = "";
    
    let subImagesData = [];
    subImages.forEach((image) => {
      // Only show non-main images
      if (!image.is_main) {
        const subImageItem = document.createElement("div");
        subImageItem.className = "sub-image-item";
        subImageItem.dataset.id = image.id;
        subImageItem.innerHTML = `
          <img src="${image.image_url}" alt="Dish sub-image" class="sub-image-preview">
          <button type="button" class="remove-image" data-id="${image.id}">&times;</button>
        `;
        subImagesContainer.appendChild(subImageItem);
        
        subImagesData.push({
          id: image.id,
          url: image.image_url,
        });
      }
    });
    
    document.getElementById("sub-images-data").value = JSON.stringify(subImagesData);
    document.querySelectorAll(".remove-image").forEach((button) => {
      button.addEventListener("click", removeSubImage);
    });
  } catch (error) {
    console.error("Error loading sub-images:", error);
  }
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
          <span class="text-gray-600">${hotel.description || "No description"}</span>
        </div>
        <div class="flex items-center mb-4">
          <span class="text-lg font-bold text-gray-800 mr-2">${Number(
            ratingValue
          ).toFixed(1)}</span>
          <div class="flex items-center text-amber-500">${starsHtml}</div>
          <span class="ml-2 text-sm text-gray-600">(${totalRatings})</span>
        </div>
        <div class="flex justify-between items-center">
          <div class="text-lg font-bold text-gray-800">${formattedPrice}</div>
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
    // First check if the bucket already exists
    try {
      const { data, error } = await window.supabase.storage
        .from("hotel-image")
        .list();
      
      // If we can list files, the bucket exists and is accessible
      if (!error) {
        console.log("Storage bucket already exists and is accessible");
        return true;
      }
      
      // If there's an error, it might be that the bucket doesn't exist
      console.log("Attempting to create storage bucket");
      
      // Try to create the bucket with proper error handling
      const { data: newBucket, error: createError } = await window.supabase.storage
        .createBucket("hotel-image", {
          public: true,
          fileSizeLimit: 10485760
        });
        
      if (createError) {
        // Handle specific error types
        if (createError.message && createError.message.includes("already exists")) {
          console.log("Bucket already exists but might have permission issues");
          return true;
        }
        
        console.error("Failed to create storage bucket:", createError);
        return false;
      } else {
        console.log("Storage bucket created successfully");
        return true;
      }
    } catch (listError) {
      console.error("Error checking storage bucket:", listError);
      return false;
    }
  } catch (error) {
    console.error("Unexpected error initializing storage:", error);
    return false;
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const storageInitialized = await initializeStorage();
  console.log(storageInitialized);
});

// Storage reorganization function - organizes images into proper folder structure
async function reorganizeStorageImages() {
  try {
    console.log("Starting storage reorganization...");
    const { data: hotels, error: hotelsError } = await window.supabase
      .from("hotels")
      .select("id");
    
    if (hotelsError) {
      console.error("Error fetching hotels:", hotelsError);
      return { success: false, message: "Failed to fetch hotels" };
    }

    for (const hotel of hotels) {
      const hotelId = hotel.id;
      try {
        // List all files in hotel folder
        const { data: files, error: listError } = await window.supabase.storage
          .from("hotel-image")
          .list(`${hotelId}`);
        
        if (listError) {
          console.log(`No files found for hotel ${hotelId}`);
          continue;
        }

        // Process each file
        for (const file of files) {
          if (file.name === "main" || file.name === "sub") {
            // Already in correct structure (folders)
            continue;
          }
          
          // Move files to correct location
          if (file.name === "main.jpg" || file.name.startsWith("main")) {
            console.log(`Hotel ${hotelId}: main image already in correct location`);
          } else if (!file.name.includes("/")) {
            // This is a loose file, should be in sub folder
            const oldPath = `${hotelId}/${file.name}`;
            const newPath = `${hotelId}/sub/${file.name}`;
            
            // Download file
            const { data: fileData, error: downloadError } = await window.supabase.storage
              .from("hotel-image")
              .download(oldPath);
            
            if (!downloadError && fileData) {
              // Upload to new location
              const { error: uploadError } = await window.supabase.storage
                .from("hotel-image")
                .upload(newPath, fileData, { upsert: true });
              
              if (!uploadError) {
                // Delete old file
                await window.supabase.storage
                  .from("hotel-image")
                  .remove([oldPath]);
                console.log(`Moved ${oldPath} to ${newPath}`);
              }
            }
          }
        }
      } catch (hotelError) {
        console.error(`Error processing hotel ${hotelId}:`, hotelError);
      }
    }

    console.log("Storage reorganization completed!");
    return { success: true, message: "Storage reorganized successfully" };
  } catch (error) {
    console.error("Error during storage reorganization:", error);
    return { success: false, message: error.message };
  }
}

window.checkUser = checkUser;
window.signIn = signIn;
window.signUp = signUp;
window.signOut = signOut;
window.getHotelById = getHotelById;
window.submitHotelRating = submitHotelRating;
window.submitComment = submitComment;
window.fetchHotelComments = fetchHotelComments;
window.displayHotels = displayHotels;
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
window.reorganizeStorageImages = reorganizeStorageImages;
window.getHotelMainImage = getHotelMainImage;
window.getHotelAdditionalImages = getHotelAdditionalImages;
window.getAvatarUrl = window.getAvatarUrl;

// Reusable card component function for both menu and hotel management pages
function createDishCardComponent(hotel, onClickCallback) {
  const card = document.createElement("div");
  card.className = "bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow display: flex flex-col";
  card.dataset.hotelId = hotel.id;
  
  const imageUrl = hotel.image_url || hotel.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
  
  const rating = hotel.average_rating || hotel.rating || 0;
  const totalRatings = hotel.total_ratings || hotel.totalRatings || 0;
  const starsHtml = window.generateDetailStarRating 
    ? window.generateDetailStarRating(rating)
    : '<div class="text-amber-500">★★★★★</div>';

  card.innerHTML = `
    <div class="relative w-full" style="height: 200px;">
      <img src="${imageUrl}" alt="${hotel.name}" class="w-full h-full object-cover" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='">
      <button class="delete-hotel-btn absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg transition-colors" data-hotel-id="${hotel.id}" title="Delete dish">
        ×
      </button>
    </div>
    <div class="p-4 flex flex-col justify-between flex-grow">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 mb-1">${hotel.name || "Untitled"}</h3>
        <p class="text-sm text-gray-600 mb-2">${hotel.description || "No description"}</p>
        <div class="flex items-center gap-1">
          <span class="text-sm font-bold text-amber-500">${Number(rating).toFixed(1)}</span>
          <div class="flex items-center">
            ${starsHtml}
          </div>
          <span class="text-xs text-gray-600">(${totalRatings})</span>
        </div>
      </div>
      <div class="text-xl font-bold text-purple-600 mt-2"><span class="icon-saudi_riyal">&#xea;</span>${Number(hotel.price || 0).toFixed(2)}</div>
    </div>
  `;

  if (onClickCallback) {
    card.addEventListener("click", (e) => {
      // Don't trigger edit if clicking delete button
      if (!e.target.closest(".delete-hotel-btn")) {
        onClickCallback(hotel);
      }
    });
  }

  // Add delete button handler
  const deleteBtn = card.querySelector(".delete-hotel-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteHotel(hotel.id);
    });
  }

  return card;
}

// Reusable avatar button component function
function createAvatarButton(avatarUrl, profileLink = "profile.html", isHidden = true) {
  const button = document.createElement("a");
  button.href = profileLink;
  button.className = "avatar-button w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-purple-400 flex items-center justify-center" + (isHidden ? " hidden" : "");
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.flexShrink = "0";
  button.style.position = "relative";
  
  const hasAvatar = avatarUrl && avatarUrl.trim() !== "";
  
  const img = document.createElement("img");
  img.className = "w-full h-full object-cover";
  img.src = avatarUrl || "";
  img.alt = "User avatar";
  img.style.display = hasAvatar ? "block" : "none";
  img.style.position = "absolute";
  img.style.inset = "0";
  
  const icon = document.createElement("i");
  icon.className = "bx bx-user text-2xl text-gray-500";
  icon.style.display = hasAvatar ? "none" : "block";
  
  button.appendChild(img);
  button.appendChild(icon);
  
  return {
    element: button,
    updateAvatar: function(newAvatarUrl) {
      if (newAvatarUrl && newAvatarUrl.trim() !== "") {
        img.src = newAvatarUrl;
        img.style.display = "block";
        icon.style.display = "none";
      } else {
        img.style.display = "none";
        icon.style.display = "block";
      }
    },
    show: function() {
      button.classList.remove("hidden");
    },
    hide: function() {
      button.classList.add("hidden");
    }
  };
}

// Toast Notification
function showToast(message, type = "success") {
  // Remove existing toast if any
  const existingToast = document.getElementById("toast-notification");
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");
  toast.id = "toast-notification";
  toast.textContent = message;
  
  const bgColor = type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500";
  toast.className = `fixed top-24 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`;
  toast.style.animation = "slideIn 0.3s ease-in-out";
  
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-in-out";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Add CSS for toast animations
if (!document.getElementById("toast-styles")) {
  const style = document.createElement("style");
  style.id = "toast-styles";
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Cart Functions
async function addToCart(hotelId, quantity, price) {
  try {
    const user = await checkUser(false);
    if (!user) {
      showToast("Please log in to add items to cart", "error");
      setTimeout(() => {
        window.location.href = "logindex.html";
      }, 1000);
      return false;
    }

    // Get or create cart for user
    let { data: cart, error: cartError } = await window.supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (cartError || !cart) {
      // Create new cart
      const { data: newCart, error: createError } = await window.supabase
        .from("carts")
        .insert([{ user_id: user.id }])
        .select()
        .single();

      if (createError) {
        console.error("Error creating cart:", createError);
        showToast("Failed to create cart", "error");
        return false;
      }
      cart = newCart;
    }

    // Check if item already in cart
    const { data: existingItem, error: checkError } = await window.supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cart.id)
      .eq("hotel_id", hotelId);

    if (existingItem && existingItem.length > 0) {
      // Update quantity
      const { error: updateError } = await window.supabase
        .from("cart_items")
        .update({ quantity: existingItem[0].quantity + quantity })
        .eq("id", existingItem[0].id);

      if (updateError) {
        console.error("Error updating cart:", updateError);
        showToast("Failed to update cart", "error");
        return false;
      }
    } else {
      // Insert new item
      const { error: insertError } = await window.supabase
        .from("cart_items")
        .insert([
          {
            cart_id: cart.id,
            hotel_id: hotelId,
            quantity: quantity,
            price: price,
          },
        ]);

      if (insertError) {
        console.error("Error adding to cart:", insertError);
        showToast("Failed to add item to cart", "error");
        return false;
      }
    }

    showToast(`✓ Added ${quantity} item${quantity > 1 ? 's' : ''} to cart!`, "success");
    return true;
  } catch (error) {
    console.error("Error in addToCart:", error);
    showToast("An error occurred while adding to cart", "error");
    return false;
  }
}

async function getCartCount() {
  try {
    const user = await checkUser(false);
    if (!user) return 0;

    const { data: cart, error: cartError } = await window.supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (cartError || !cart) return 0;

    const { count, error: countError } = await window.supabase
      .from("cart_items")
      .select("*", { count: "exact", head: true })
      .eq("cart_id", cart.id);

    return count || 0;
  } catch (error) {
    console.error("Error getting cart count:", error);
    return 0;
  }
}

async function deleteHotel(hotelId) {
  try {
    // Show beautiful confirmation modal
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      `;
      
      const modal = document.createElement("div");
      modal.style.cssText = `
        background: white;
        padding: 40px;
        border-radius: 12px;
        text-align: center;
        max-width: 450px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      `;
      
      modal.innerHTML = `
        <div style="font-size: 48px; color: #ef4444; margin-bottom: 20px;">⚠</div>
        <h2 style="color: #333; margin-bottom: 15px; font-size: 24px; font-weight: 700;">Delete Dish?</h2>
        <p style="color: #666; margin-bottom: 20px; line-height: 1.6;">
          This action will permanently delete the dish and all associated:
        </p>
        <div style="color: #666; margin-bottom: 20px; text-align: left; background: #f9fafb; padding: 12px; border-radius: 8px; font-size: 14px;">
          <p style="margin: 4px 0;"><strong>✓ Images</strong></p>
          <p style="margin: 4px 0;"><strong>✓ Ratings</strong></p>
          <p style="margin: 4px 0;"><strong>✓ All data</strong></p>
        </div>
        <p style="color: #ef4444; font-weight: 600; margin-bottom: 25px;">This cannot be undone.</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="cancelDeleteBtn" style="padding: 10px 30px; background: #e5e7eb; color: #333; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.3s;">
            Cancel
          </button>
          <button id="confirmDeleteBtn" style="padding: 10px 30px; background: #ef4444; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.3s;">
            Delete Permanently
          </button>
        </div>
      `;
      
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      
      document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
        overlay.remove();
        resolve(false);
      });
      
      document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
        overlay.remove();
        
        try {
          const user = await checkUser(true);
          if (!user) {
            showNotification("You must be logged in to delete dishes", "error");
            resolve(false);
            return;
          }

          // Verify user owns the hotel
          const { data: hotel, error: hotelError } = await window.supabase
            .from("hotels")
            .select("owner_id")
            .eq("id", hotelId)
            .single();

          if (hotelError || !hotel) {
            showNotification("Dish not found", "error");
            resolve(false);
            return;
          }

          if (hotel.owner_id !== user.id) {
            showNotification("You don't have permission to delete this dish", "error");
            resolve(false);
            return;
          }

          showNotification("Deleting dish...", "info");

          // Delete all related images from storage and database
          const { data: images } = await window.supabase
            .from("hotel_images")
            .select("image_url, id")
            .eq("hotel_id", hotelId);

          if (images && images.length > 0) {
            for (const image of images) {
              try {
                // Delete from storage
                const imageUrl = image.image_url;
                const storagePath = imageUrl.split("/storage/v1/object/public/hotel-image/")[1];
                if (storagePath) {
                  await window.supabase.storage
                    .from("hotel-image")
                    .remove([decodeURIComponent(storagePath)]);
                }
                // Delete from database
                await window.supabase
                  .from("hotel_images")
                  .delete()
                  .eq("id", image.id);
              } catch (err) {
                console.error("Error deleting image:", err);
              }
            }
          }

          // Delete all ratings related to this hotel
          await window.supabase
            .from("ratings")
            .delete()
            .eq("hotel_id", hotelId);

          // Delete the hotel
          const { error: deleteError } = await window.supabase
            .from("hotels")
            .delete()
            .eq("id", hotelId);

          if (deleteError) {
            console.error("Error deleting hotel:", deleteError);
            showNotification("Error deleting dish: " + deleteError.message, "error");
            resolve(false);
            return;
          }

          showNotification("Dish deleted successfully", "success");
          
          // Reload the hotels list
          if (typeof loadHotelData === "function") {
            loadHotelData();
          }
          resolve(true);
        } catch (error) {
          console.error("Error in deleteHotel:", error);
          showNotification("Error deleting dish: " + error.message, "error");
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error("Error in deleteHotel:", error);
    showNotification("Error deleting dish: " + error.message, "error");
  }
}

window.createDishCardComponent = createDishCardComponent;
window.createAvatarButton = createAvatarButton;
window.addToCart = addToCart;
window.getCartCount = getCartCount;
window.deleteHotel = deleteHotel;
