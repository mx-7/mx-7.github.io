// Supabase.js - Handles all Supabase related operations

// Sample hotels data as fallback
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

// Global variables
window.isLoggedIn = false;
window.userAvatarUrl = null;

// User Authentication Functions

/**
 * Check if a user is logged in
 * @param {boolean} [requireAuth=false] - Whether to redirect to login if not authenticated
 * @returns {Promise<Object|null>} The current user or null if not logged in
 */
async function checkUser(requireAuth = false) {
  try {
    const {
      data: { session },
      error,
    } = await window.supabase.auth.getSession();

    if (error) {
      console.error("Error checking authentication:", error);
      window.isLoggedIn = false;
      return null;
    }

    if (!session || !session.user) {
      console.log("User not authenticated");
      window.isLoggedIn = false;

      // Only redirect to login if authentication is required for this page
      if (requireAuth) {
        console.log("Authentication required, redirecting to login");
        window.location.href = "logindex.html";
      }

      return null;
    }

    console.log("User authenticated:", session.user);
    window.isLoggedIn = true;

    // Get avatar URL when user is authenticated
    await loadUserAvatar(session.user.id);

    return session.user;
  } catch (error) {
    console.error("Error in checkUser:", error);
    window.isLoggedIn = false;
    return null;
  }
}

/**
 * Load the user's avatar URL from their profile
 * @param {string} userId - The user's ID
 * @returns {Promise<string|null>} The avatar URL or null if not found
 */
async function loadUserAvatar(userId) {
  try {
    const { data: profile, error } = await window.supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      console.error("Error loading user avatar:", error);
      window.userAvatarUrl = null;
      return null;
    }

    window.userAvatarUrl = profile.avatar_url || null;
    return window.userAvatarUrl;
  } catch (error) {
    console.error("Error in loadUserAvatar:", error);
    window.userAvatarUrl = null;
    return null;
  }
}

/**
 * Get the user's profile data
 * @param {string} userId - The user's ID
 * @returns {Promise<Object|null>} The user's profile or null if not found
 */
async function getUserProfile(userId) {
  try {
    const { data: profile, error } = await window.supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return null;
  }
}

/**
 * Update the user's profile avatar
 * @param {string} userId - The user's ID
 * @param {string|null} avatarUrl - The URL of the avatar image (null to remove)
 * @returns {Promise<Object>} Object containing success and message
 */
async function updateUserAvatar(userId, avatarUrl) {
  try {
    const { error } = await window.supabase
      .from("profiles")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating user avatar:", error);
      return {
        success: false,
        message: error.message,
      };
    }

    // Update the global avatar URL
    window.userAvatarUrl = avatarUrl;

    return {
      success: true,
      message: avatarUrl
        ? "Avatar updated successfully"
        : "Avatar removed successfully",
    };
  } catch (error) {
    console.error("Error in updateUserAvatar:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Update the user's profile with a new avatar URL
 * @param {string|null} avatarUrl - The new avatar URL (null to remove)
 * @returns {Promise<boolean>} Whether the update was successful
 */
async function updateAvatar(avatarUrl) {
  try {
    const user = await checkUser();
    if (!user) {
      throw new Error("You must be logged in to update your avatar");
    }

    const result = await updateUserAvatar(user.id, avatarUrl);

    if (result.success) {
      // Update UI if available
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

      // Update global avatar URL
      window.userAvatarUrl = avatarUrl;

      return true;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Error in updateAvatar:", error);
    throw error;
  }
}

/**
 * Compress an image file to reduce file size
 * @param {File} file - The image file to compress
 * @returns {Promise<Blob>} The compressed image as a Blob
 */
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");

        // Calculate new dimensions while maintaining aspect ratio
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

        // Convert to blob with reduced quality
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          file.type,
          0.7 // Quality parameter (0.7 = 70% quality)
        );
      };
      img.onerror = (error) => {
        reject(error);
      };
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
}

/**
 * Display status message to the user
 * @param {string} type - Type of status: success, error, info
 * @param {string} message - Message to display
 */
function showStatus(type, message) {
  const statusElement = document.getElementById("file-upload-status");
  if (!statusElement) return;

  statusElement.textContent = message;

  switch (type) {
    case "success":
      statusElement.style.color = "#a3e635"; // Light green
      break;
    case "error":
      statusElement.style.color = "#f87171"; // Light red
      break;
    case "info":
    default:
      statusElement.style.color = "#ffffff"; // White
      break;
  }

  // Clear status after 3 seconds
  setTimeout(() => {
    statusElement.textContent = "";
  }, 3000);
}

/**
 * Load profile data for the profile page
 * @param {Object} user - The current user object
 */
async function loadProfileData(user) {
  try {
    // Get user profile details
    const profile = await getUserProfile(user.id);

    if (!profile) {
      showStatus("error", "Could not load profile data");
      return;
    }

    // Update username and email in UI
    const usernameElement = document.getElementById("profile-username");
    const emailElement = document.getElementById("profile-email");

    if (usernameElement) {
      usernameElement.textContent = profile.username || "Username not set";
    }

    if (emailElement) {
      emailElement.textContent =
        profile.email || user.email || "Email not available";
    }

    // Update avatar if available
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
    console.error("Error loading profile data:", error);
    showStatus("error", "Error loading profile data");
  }
}

/**
 * Sign in a user with email and password
 * @param {string} email - The user's email
 * @param {string} password - The user's password
 * @returns {Promise<Object>} Object containing status and message
 */
async function signIn(email, password) {
  try {
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Error signing in:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Sign up a new user
 * @param {string} email - The user's email
 * @param {string} password - The user's password
 * @param {string} username - The user's username
 * @returns {Promise<Object>} Object containing status and message
 */
async function signUp(email, password, username) {
  try {
    if (username.length < 3) {
      return {
        success: false,
        message: "Username must be at least 3 characters long",
      };
    }

    // Check if username already exists
    const { data: existingUser, error: checkError } = await window.supabase
      .from("profiles")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (checkError) {
      return {
        success: false,
        message: "Error checking username availability",
      };
    }

    if (existingUser) {
      return {
        success: false,
        message: "Username already taken",
        code: "USERNAME_TAKEN",
      };
    }

    // Sign up
    const { data: authData, error: authError } =
      await window.supabase.auth.signUp({
        email,
        password,
      });

    if (authError) {
      return { success: false, message: authError.message };
    }

    // Wait for user session to exist (for non-email-confirm flows)
    const sessionCheck = await window.supabase.auth.getSession();
    const session = sessionCheck.data.session;

    if (!session) {
      return {
        success: true,
        message:
          "Account created! Please check your email to confirm before proceeding.",
      };
    }

    const userId = session.user.id;

    // Update username now that session is active
    const { error: usernameUpdateError } = await window.supabase
      .from("profiles")
      .update({ username })
      .eq("id", userId);

    if (usernameUpdateError) {
      return {
        success: false,
        message: "Profile created, but setting username failed.",
      };
    }

    return { success: true, data: authData };
  } catch (error) {
    return { success: false, message: error.message || "Unexpected error" };
  }
}

/**
 * Sign out the current user
 */
async function signOut() {
  try {
    const { error } = await window.supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error);
      return {
        success: false,
        message: error.message,
      };
    }

    console.log("User signed out successfully");
    window.location.href = "logindex.html";
    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in signOut:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Get hotel details by ID with ratings
 * @param {number} hotelId - The ID of the hotel to get
 * @returns {Promise<Object>} The hotel details
 */
async function getHotelById(hotelId) {
  try {
    // Query the hotel with its ratings
    const { data, error } = await window.supabase
      .from("hotels")
      .select(
        `
        *,
        ratings(rating)
      `
      )
      .eq("id", hotelId)
      .single();

    if (error) {
      console.error("Error fetching hotel:", error);
      return null;
    }

    if (data) {
      // Process the hotel to include the average rating
      const hotel = {
        ...data,
        rating:
          data.ratings?.length > 0
            ? data.ratings.reduce((sum, r) => sum + r.rating, 0) /
              data.ratings.length
            : 0.0, // 0.0 when no ratings exist
        totalRatings: data.ratings?.length || 0,
      };
      return hotel;
    }

    return null;
  } catch (error) {
    console.error("Error in getHotelById:", error);
    return null;
  }
}

/**
 * Submit a rating for a hotel
 * @param {number} hotelId - The ID of the hotel to rate
 * @param {number} rating - The rating value (1-5)
 * @returns {Promise<Object>} Object containing success and message
 */
async function submitHotelRating(hotelId, rating) {
  try {
    // First check if user is authenticated
    const user = await checkUser();
    if (!user) {
      return {
        success: false,
        message: "You must be logged in to submit a rating",
      };
    }

    // Validate the rating value
    if (rating < 1 || rating > 5) {
      return {
        success: false,
        message: "Rating must be between 1 and 5",
      };
    }

    // Check if this user has already rated this hotel
    const { data: existingRating, error: fetchError } = await window.supabase
      .from("ratings")
      .select("*")
      .eq("user_id", user.id)
      .eq("hotel_id", hotelId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // Error other than "no rows returned"
      console.error("Error checking existing rating:", fetchError);
      return {
        success: false,
        message: "Error checking your existing rating",
      };
    }

    // If rating exists, update it
    if (existingRating) {
      console.log("Updating existing rating:", {
        user_id: user.id,
        hotel_id: hotelId,
        rating: rating,
        existing_id: existingRating.id,
      });

      // Use the correct update pattern with proper filters
      const { error: updateError } = await window.supabase
        .from("ratings")
        .update({ rating: rating }) // Only update the rating column
        .eq("user_id", user.id) // Filter by user_id
        .eq("hotel_id", hotelId); // AND hotel_id

      if (updateError) {
        console.error("Error updating rating:", updateError);
        return {
          success: false,
          message: "Failed to update your rating",
        };
      }

      return {
        success: true,
        message: "Rating updated successfully",
      };
    }
    // Otherwise insert a new rating
    else {
      console.log("Inserting new rating:", {
        user_id: user.id,
        hotel_id: hotelId,
        rating: rating,
      });

      const { error: insertError } = await window.supabase
        .from("ratings")
        .insert([
          {
            user_id: user.id,
            hotel_id: hotelId,
            rating: rating,
          },
        ]);

      if (insertError) {
        console.error("Error inserting rating:", insertError);
        return {
          success: false,
          message: "Failed to submit your rating",
        };
      }

      return {
        success: true,
        message: "Rating submitted successfully",
      };
    }
  } catch (error) {
    console.error("Error in submitHotelRating:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Submit a comment for a hotel
 * @param {number} hotelId - The ID of the hotel to comment on
 * @param {string} commentText - The comment text
 * @returns {Promise<Object>} Object containing success and message
 */
async function submitComment(hotelId, commentText) {
  try {
    const user = await checkUser();
    if (!user) {
      return { success: false, message: "You must be logged in to comment." };
    }

    // Check if the user has already commented/rated
    const { data: existing, error: fetchError } = await window.supabase
      .from("ratings")
      .select("id, rating, comment")
      .eq("user_id", user.id)
      .eq("hotel_id", hotelId)
      .single();

    // If user has already rated but not commented, update the existing rating
    if (existing) {
      console.log("Updating existing rating with comment:", {
        user_id: user.id,
        hotel_id: hotelId,
        existing_id: existing.id,
        has_comment: !!existing.comment,
      });

      // If already has a comment, don't allow another one
      if (existing.comment) {
        return {
          success: false,
          message: "You have already submitted a comment.",
        };
      }

      // Update the existing rating with the comment
      const { error: updateError } = await window.supabase
        .from("ratings")
        .update({ comment: commentText })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Update error:", updateError);
        return { success: false, message: "Failed to submit comment." };
      }

      return { success: true, message: "Comment submitted successfully." };
    }

    // If no existing rating, insert a new rating with comment
    console.log("Inserting new rating with comment:", {
      user_id: user.id,
      hotel_id: hotelId,
    });

    // Insert a new rating + comment
    const { error: insertError } = await window.supabase
      .from("ratings")
      .insert({
        user_id: user.id,
        hotel_id: parseInt(hotelId),
        rating: 5, // Default rating
        comment: commentText,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return { success: false, message: "Failed to submit comment." };
    }

    return {
      success: true,
      message: "Rating and comment submitted successfully.",
    };
  } catch (error) {
    console.error("Error in submitComment:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}

/**
 * Fetch comments for a hotel
 * @param {number} hotelId - The ID of the hotel to get comments for
 * @returns {Promise<Array>} Array of comments
 */
async function fetchHotelComments(hotelId) {
  try {
    // Get all comments for this hotel that aren't null
    const { data, error } = await window.supabase
      .from("ratings")
      .select("comment, created_at, user_id, rating")
      .eq("hotel_id", parseInt(hotelId))
      .not("comment", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchHotelComments:", error);
    return [];
  }
}

/**
 * Upload a hotel image to Supabase storage
 * @param {File} file - The image file to upload
 * @param {number|string} hotelId - The ID of the hotel
 * @param {boolean} isMain - Whether this is the main image or a sub-image
 * @returns {Promise<string>} The public URL of the uploaded image
 */
async function uploadHotelImage(file, hotelId, isMain = false) {
  try {
    // Compress the image before uploading
    const compressedImageBlob = await compressImage(file);

    // Create a new File object from the compressed blob
    const compressedFile = new File([compressedImageBlob], file.name, {
      type: file.type,
    });

    // Determine the storage path based on whether it's a main image or sub-image
    const path = isMain
      ? `${hotelId}/main.jpg`
      : `${hotelId}/sub/${Date.now()}.jpg`;

    // Upload the image to Supabase Storage
    const { data, error } = await window.supabase.storage
      .from("hotel-images")
      .upload(path, compressedFile, {
        contentType: file.type,
        upsert: true, // Replace if exists (important for main image)
      });

    if (error) {
      console.error("Error uploading image:", error);
      throw error;
    }

    // Get the public URL of the uploaded image
    const { data: urlData } = window.supabase.storage
      .from("hotel-images")
      .getPublicUrl(path);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in uploadHotelImage:", error);
    throw error;
  }
}

/**
 * Save the main image URL to the hotels table
 * @param {number|string} hotelId - The ID of the hotel
 * @param {string} imageUrl - The URL of the main image
 * @returns {Promise<Object>} Object containing success and message
 */
async function saveMainImageUrl(hotelId, imageUrl) {
  try {
    const { error } = await window.supabase
      .from("hotels")
      .update({ main_image_url: imageUrl })
      .eq("id", hotelId);

    if (error) {
      console.error("Error saving main image URL:", error);
      return {
        success: false,
        message: "Failed to save main image URL",
      };
    }

    return {
      success: true,
      message: "Main image URL saved successfully",
    };
  } catch (error) {
    console.error("Error in saveMainImageUrl:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Save a sub-image URL to the hotel_images table
 * @param {number|string} hotelId - The ID of the hotel
 * @param {string} imageUrl - The URL of the sub-image
 * @returns {Promise<Object>} Object containing success and message
 */
async function saveSubImageUrl(hotelId, imageUrl) {
  try {
    const { error } = await window.supabase.from("hotel_images").insert([
      {
        hotel_id: hotelId,
        image_url: imageUrl,
      },
    ]);

    if (error) {
      console.error("Error saving sub-image URL:", error);
      return {
        success: false,
        message: "Failed to save sub-image URL",
      };
    }

    return {
      success: true,
      message: "Sub-image URL saved successfully",
    };
  } catch (error) {
    console.error("Error in saveSubImageUrl:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Delete a hotel image from Supabase storage and optionally from the database
 * @param {string} path - The storage path of the image to delete
 * @param {boolean} removeFromDb - Whether to also remove the entry from database
 * @param {string} imageUrl - The URL of the image (needed if removeFromDb is true)
 * @returns {Promise<Object>} Object containing success and message
 */
async function deleteHotelImage(path, removeFromDb = false, imageUrl = null) {
  try {
    // Delete from storage
    const { error } = await window.supabase.storage
      .from("hotel-images")
      .remove([path]);

    if (error) {
      console.error("Error deleting image:", error);
      return {
        success: false,
        message: "Failed to delete image from storage",
      };
    }

    // Optional: remove from database if specified
    if (removeFromDb && imageUrl) {
      // Determine if it's a main image or sub-image based on the path
      if (path.includes("/main.jpg")) {
        // It's a main image, clear the main_image_url field
        const hotelId = path.split("/")[0]; // Extract hotel ID from path
        const { error: dbError } = await window.supabase
          .from("hotels")
          .update({ main_image_url: null })
          .eq("id", hotelId);

        if (dbError) {
          console.error(
            "Error removing main image URL from database:",
            dbError
          );
          return {
            success: false,
            message: "Image deleted from storage but failed to update database",
          };
        }
      } else {
        // It's a sub-image, delete the record from hotel_images
        const { error: dbError } = await window.supabase
          .from("hotel_images")
          .delete()
          .eq("image_url", imageUrl);

        if (dbError) {
          console.error("Error removing sub-image from database:", dbError);
          return {
            success: false,
            message: "Image deleted from storage but failed to update database",
          };
        }
      }
    }

    return {
      success: true,
      message: "Image deleted successfully",
    };
  } catch (error) {
    console.error("Error in deleteHotelImage:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Get all sub-images for a hotel
 * @param {number|string} hotelId - The ID of the hotel
 * @returns {Promise<Array>} Array of image objects
 */
async function getHotelSubImages(hotelId) {
  try {
    const { data, error } = await window.supabase
      .from("hotel_images")
      .select("*")
      .eq("hotel_id", hotelId);

    if (error) {
      console.error("Error fetching hotel sub-images:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getHotelSubImages:", error);
    return [];
  }
}

/**
 * Delete all images for a hotel (when deleting the hotel)
 * @param {number|string} hotelId - The ID of the hotel to delete images for
 * @returns {Promise<Object>} Object containing success and message
 */
async function deleteAllHotelImages(hotelId) {
  try {
    // List all files in the hotel's directory
    const { data, error } = await window.supabase.storage
      .from("hotel-images")
      .list(`${hotelId}`);

    if (error) {
      console.error("Error listing hotel images:", error);
      return {
        success: false,
        message: "Failed to list hotel images",
      };
    }

    // If there are files, delete them all
    if (data && data.length > 0) {
      const filePaths = data.map((file) => `${hotelId}/${file.name}`);

      const { error: deleteError } = await window.supabase.storage
        .from("hotel-images")
        .remove(filePaths);

      if (deleteError) {
        console.error("Error deleting hotel images:", deleteError);
        return {
          success: false,
          message: "Failed to delete some hotel images",
        };
      }
    }

    // Also list and delete sub-images
    const { data: subData, error: subError } = await window.supabase.storage
      .from("hotel-images")
      .list(`${hotelId}/sub`);

    if (!subError && subData && subData.length > 0) {
      const subFilePaths = subData.map((file) => `${hotelId}/sub/${file.name}`);

      await window.supabase.storage.from("hotel-images").remove(subFilePaths);
    }

    return {
      success: true,
      message: "All hotel images deleted successfully",
    };
  } catch (error) {
    console.error("Error in deleteAllHotelImages:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Load hotel data from the database for the hotel management page
 * @returns {Promise<Array>} Array of hotel objects
 */
async function loadHotelData() {
  try {
    // Get current user to restrict access to only their hotels
    const user = await checkUser(true);
    if (!user) {
      return [];
    }

    // Show loading indicator
    const loadingElement = document.getElementById("loading");
    const noHotelsElement = document.getElementById("no-hotels");
    const hotelsGridElement = document.getElementById("hotels-grid");

    if (loadingElement) loadingElement.classList.remove("hidden");
    if (noHotelsElement) noHotelsElement.classList.add("hidden");
    if (hotelsGridElement) hotelsGridElement.classList.add("hidden");

    // Fetch hotels belonging to the current user
    const { data: hotels, error } = await window.supabase
      .from("hotels")
      .select("*")
      .eq("owner_id", user.id);
    // Removed the order by created_at since the column doesn't exist

    // Hide loading indicator
    if (loadingElement) loadingElement.classList.add("hidden");

    if (error) {
      console.error("Error loading hotels:", error);
      return [];
    }

    // Update UI based on whether we have hotels or not
    if (hotels && hotels.length > 0) {
      if (hotelsGridElement) {
        // Clear existing hotels
        hotelsGridElement.innerHTML = "";

        // Add each hotel to the grid
        hotels.forEach((hotel) => {
          const hotelCard = createHotelCard(hotel);
          hotelsGridElement.appendChild(hotelCard);
        });

        hotelsGridElement.classList.remove("hidden");
      }
    } else {
      // Show "no hotels" message if no hotels found
      if (noHotelsElement) noHotelsElement.classList.remove("hidden");
    }

    return hotels || [];
  } catch (error) {
    console.error("Error in loadHotelData:", error);

    // Hide loading indicator in case of error
    const loadingElement = document.getElementById("loading");
    if (loadingElement) loadingElement.classList.add("hidden");

    return [];
  }
}

/**
 * Creates a hotel card element for display in the hotels grid
 * @param {Object} hotel - The hotel data object
 * @returns {HTMLElement} - The hotel card element
 */
function createHotelCard(hotel) {
  const card = document.createElement("div");
  card.className =
    "hotel-card bg-white rounded-lg shadow-md overflow-hidden cursor-pointer";
  card.dataset.hotelId = hotel.id;

  // Default image if none is provided
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
        <h4 class="text-xs font-medium text-gray-700 mb-2">Additional Images</h4>
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

  // Add click event to edit the hotel
  card.addEventListener("click", (e) => {
    // Ignore clicks on the "Edit" button or file inputs
    if (
      e.target.closest(".edit-hotel-btn") ||
      e.target.closest('input[type="file"]')
    ) {
      return;
    }

    // Handle hotel card click - show edit form
    showEditHotelForm(hotel);
  });

  // Add click event specifically for the edit button
  const editBtn = card.querySelector(".edit-hotel-btn");
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      showEditHotelForm(hotel);
    });
  }

  return card;
}

/**
 * Shows the edit hotel form with pre-filled data
 * @param {Object} hotel - The hotel data to edit
 */
function showEditHotelForm(hotel) {
  // Get the form sections
  const listSection = document.getElementById("hotels-list-section");
  const formSection = document.getElementById("hotel-form-section");
  const formTitle = document.getElementById("form-title");

  // Show the form and hide the list
  if (listSection) listSection.classList.add("hidden");
  if (formSection) formSection.classList.remove("hidden");
  if (formTitle) formTitle.textContent = "Edit Hotel";

  // Fill the form with hotel data
  document.getElementById("hotel-id").value = hotel.id;
  document.getElementById("hotel-name").value = hotel.name || "";
  document.getElementById("hotel-location").value = hotel.location || "";
  document.getElementById("hotel-price").value = hotel.price || "";
  document.getElementById("hotel-rating").value = hotel.rating || "";
  document.getElementById("hotel-description").value = hotel.description || "";
  document.getElementById("hotel-main-image").value = hotel.image || "";

  // Handle main image preview
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

  // Set the form submit button text
  document.getElementById("submit-btn-text").textContent = "Update Hotel";
}

// Helper function to display hotels
function displayHotels(hotels) {
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

  hotels.forEach((hotel) => {
    const card = document.createElement("div");
    card.className =
      "snap-start flex-shrink-0 w-80 sm:w-72 md:w-80 lg:w-96 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden";

    // Format the price with the Saudi Riyal icon
    const formattedPrice = `<span class="icon-saudi_riyal">&#xea;</span>${hotel.price}`;

    // Use 0.0 and gray stars if no rating
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
        <img src="${hotel.image}" alt="${
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
  });
}

// SVG star rating to match hotel-details.html
function generateDetailStarRating(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  let starsHtml = "";
  // If rating is 0, show 5 gray stars
  if (Number(rating) === 0) {
    for (let i = 0; i < 5; i++) {
      starsHtml += `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"#CBD5E0\" class=\"text-gray-300\"><path d=\"M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z\"/></svg>`;
    }
    return starsHtml;
  }
  // Full stars
  for (let i = 0; i < fullStars; i++) {
    starsHtml += `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"currentColor\" class=\"text-yellow-500\"><path d=\"M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z\"/></svg>`;
  }
  // Half star
  if (hasHalfStar) {
    starsHtml += `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" class=\"text-yellow-500\"><defs><linearGradient id=\"half-${rating}\"><stop offset=\"50%\" stop-color=\"currentColor\" /><stop offset=\"50%\" stop-color=\"#CBD5E0\" /></linearGradient></defs><path d=\"M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z\" fill=\"url(#half-${rating})\"/></svg>`;
  }
  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"#CBD5E0\" class=\"text-gray-300\"><path d=\"M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z\"/></svg>`;
  }
  return starsHtml;
}

// Export functions for use in other files
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
