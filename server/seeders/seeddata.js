/**
 * seedData.js
 * ═══════════════════════════════════════════════════════════════════════════
 * Data templates and configurations for superSeeder.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const SEED_DATA = {
    // ─────────────────────────────────────────────────────────────────────────
    // PASSWORDS
    // ─────────────────────────────────────────────────────────────────────────
    PASSWORDS: {
      OWNERS:   ['OwnerPass@1', 'OwnerPass@2'],
      STAFF:    'StaffPass@123',
      CUSTOMER: 'Customer@123',
    },
  
    // ─────────────────────────────────────────────────────────────────────────
    // OWNERS
    // ─────────────────────────────────────────────────────────────────────────
    OWNERS: [
      {
        name: 'James Harrington',
        email: 'james.harrington@luxhotel.com',
        phone: '+1-212-555-0101',
      },
      {
        name: 'Sofia Alvarez',
        email: 'sofia.alvarez@coastresort.com',
        phone: '+1-310-555-0202',
      },
    ],
  
    // ─────────────────────────────────────────────────────────────────────────
    // STAFF (mix of managers and receptionists)
    // ─────────────────────────────────────────────────────────────────────────
    STAFF: [
      { name: 'David Park', email: 'david.park@luxhotel.com', role: 'manager', phone: '+1-212-555-0301' },
      { name: 'Mia Thompson', email: 'mia.thompson@luxhotel.com', role: 'receptionist', phone: '+1-212-555-0302' },
      { name: 'Marcus Johnson', email: 'marcus.johnson@luxhotel.com', role: 'receptionist', phone: '+1-212-555-0303' },
      { name: 'Carlos Rivera', email: 'carlos.rivera@coastresort.com', role: 'manager', phone: '+1-310-555-0401' },
      { name: 'Aisha Nwosu', email: 'aisha.nwosu@coastresort.com', role: 'receptionist', phone: '+1-310-555-0402' },
      { name: 'Priya Singh', email: 'priya.singh@coastresort.com', role: 'receptionist', phone: '+1-310-555-0403' },
    ],
  
    // ─────────────────────────────────────────────────────────────────────────
    // CUSTOMERS (20 diverse travelers)
    // ─────────────────────────────────────────────────────────────────────────
    CUSTOMERS: [
      { name: 'Liam Johnson', email: 'liam.johnson@gmail.com', phone: '+1-415-555-1001' },
      { name: 'Emma Wilson', email: 'emma.wilson@gmail.com', phone: '+1-415-555-1002' },
      { name: 'Noah Davis', email: 'noah.davis@yahoo.com', phone: '+1-617-555-1003' },
      { name: 'Olivia Martinez', email: 'olivia.martinez@yahoo.com', phone: '+1-617-555-1004' },
      { name: 'William Brown', email: 'william.brown@outlook.com', phone: '+1-713-555-1005' },
      { name: 'Ava Garcia', email: 'ava.garcia@outlook.com', phone: '+1-713-555-1006' },
      { name: 'James Miller', email: 'james.miller@proton.me', phone: '+1-305-555-1007' },
      { name: 'Isabella Jones', email: 'isabella.jones@proton.me', phone: '+1-305-555-1008' },
      { name: 'Oliver Taylor', email: 'oliver.taylor@icloud.com', phone: '+1-503-555-1009' },
      { name: 'Sophia Anderson', email: 'sophia.anderson@icloud.com', phone: '+1-503-555-1010' },
      { name: 'Benjamin Thomas', email: 'benjamin.thomas@gmail.com', phone: '+1-206-555-1011' },
      { name: 'Charlotte Lee', email: 'charlotte.lee@gmail.com', phone: '+1-206-555-1012' },
      { name: 'Lucas White', email: 'lucas.white@yahoo.com', phone: '+1-202-555-1013' },
      { name: 'Amelia Harris', email: 'amelia.harris@yahoo.com', phone: '+1-202-555-1014' },
      { name: 'Mason Martin', email: 'mason.martin@outlook.com', phone: '+1-404-555-1015' },
      { name: 'Harper Thompson', email: 'harper.thompson@outlook.com', phone: '+1-404-555-1016' },
      { name: 'Ethan Jackson', email: 'ethan.jackson@proton.me', phone: '+1-214-555-1017' },
      { name: 'Evelyn White', email: 'evelyn.white@proton.me', phone: '+1-214-555-1018' },
      { name: 'Logan Harris', email: 'logan.harris@icloud.com', phone: '+1-480-555-1019' },
      { name: 'Abigail Clark', email: 'abigail.clark@icloud.com', phone: '+1-480-555-1020' },
    ],
  
    // ─────────────────────────────────────────────────────────────────────────
    // HOTELS (2 luxury properties)
    // ─────────────────────────────────────────────────────────────────────────
    HOTELS: [
      {
        name: 'Grand Azure Hotel Manhattan',
        description: 'A prestigious five-star urban retreat nestled in the heart of Manhattan. Grand Azure combines Art Deco heritage with contemporary luxury, offering panoramic skyline views, a world-class spa, and Michelin-starred dining. Perfect for the discerning traveler seeking sophistication and impeccable service.',
        starRating: 5,
        address: {
          street: '350 Fifth Avenue',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10118',
          coordinates: { lat: 40.7484, lng: -73.9967 },
        },
        contact: {
          phone: '+1-212-555-9000',
          email: 'reservations@grandazure.com',
          website: 'https://grandazure.com',
        },
        amenities: [
          'Free Wi-Fi',
          'Rooftop Pool',
          'Full-Service Spa',
          'Fitness Center',
          'Valet Parking',
          'Concierge 24/7',
          'Business Center',
          'Fine Dining Restaurant',
          'Cocktail Lounge',
          'Dry Cleaning',
          'Room Service 24/7',
          'Pet-Friendly Rooms',
        ],
        branding: {
          primaryColor: '#0e5fa3',
          secondaryColor: '#1a1c2e',
          tagline: 'Where the sky meets luxury.',
        },
        policies: {
          checkInTime: '15:00',
          checkOutTime: '11:00',
          cancellationHours: 48,
          petsAllowed: true,
          smokingAllowed: false,
        },
        coverImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200',
        images: [
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
        ],
      },
      {
        name: 'Velvet Pines Coastal Resort',
        description: 'Nestled among ancient redwoods on the California coast, Velvet Pines Resort is the ultimate nature-luxury escape. With private beach access, forest spa treatments, and farm-to-table cuisine, every stay is an immersive sensory journey. Discover tranquility without sacrificing elegance.',
        starRating: 4,
        address: {
          street: '1 Coastal Ridge Drive',
          city: 'Big Sur',
          state: 'CA',
          country: 'USA',
          zipCode: '93920',
          coordinates: { lat: 36.2704, lng: -121.8081 },
        },
        contact: {
          phone: '+1-831-555-7000',
          email: 'hello@velvetpines.com',
          website: 'https://velvetpines.com',
        },
        amenities: [
          'Free Wi-Fi',
          'Outdoor Infinity Pool',
          'Forest Spa',
          'Yoga Studio',
          'Private Beach Access',
          'Hiking Trails',
          'Farm-to-Table Restaurant',
          'Wine Cellar',
          'Kayak Rentals',
          'Campfire Lounge',
          'Bicycle Hire',
          'Organic Gardens',
        ],
        branding: {
          primaryColor: '#2d6a4f',
          secondaryColor: '#1b263b',
          tagline: 'Luxury rooted in nature.',
        },
        policies: {
          checkInTime: '14:00',
          checkOutTime: '12:00',
          cancellationHours: 72,
          petsAllowed: false,
          smokingAllowed: false,
        },
        coverImage: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1200',
        images: [
          'https://images.unsplash.com/photo-1587213811864-46e59f6873a1?w=800',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
        ],
      },
    ],
  
    // ─────────────────────────────────────────────────────────────────────────
    // ROOM CATALOG (6 types with realistic data)
    // ─────────────────────────────────────────────────────────────────────────
    ROOM_CATALOG: [
      {
        type: 'standard',
        name: 'Standard Room',
        description: 'A well-appointed room with city views, offering all the essentials for a comfortable stay.',
        basePrice: 150,
        maxAdults: 2,
        maxChildren: 1,
        sizeM2: 28,
        beds: [{ type: 'queen', count: 1 }],
        totalRooms: 25,
        amenities: ['Free Wi-Fi', 'Flat-Screen TV', 'Air Conditioning', 'Mini Fridge', 'Safe', 'Hair Dryer', 'Coffee Maker'],
      },
      {
        type: 'deluxe',
        name: 'Deluxe Room',
        description: 'Elevated comfort with premium linens, a king bed, and a deeper city panorama.',
        basePrice: 230,
        maxAdults: 2,
        maxChildren: 1,
        sizeM2: 38,
        beds: [{ type: 'king', count: 1 }],
        totalRooms: 20,
        amenities: ['Free Wi-Fi', 'Flat-Screen TV', 'Air Conditioning', 'Minibar', 'Safe', 'Bathtub', 'Separate Shower', 'Bathrobe & Slippers', 'Nespresso Machine', 'Smart Controls'],
      },
      {
        type: 'suite',
        name: 'Executive Suite',
        description: 'A full suite with separate living room, premium wet bar, and sweeping views to impress any discerning traveller.',
        basePrice: 420,
        maxAdults: 3,
        maxChildren: 2,
        sizeM2: 65,
        beds: [{ type: 'king', count: 1 }, { type: 'sofa', count: 1 }],
        totalRooms: 10,
        amenities: ['Free Wi-Fi', '65" Smart TV', 'Separate Living Area', 'Dining Area', 'Minibar', 'Espresso Machine', 'Jacuzzi Tub', 'Double Shower', 'Butler Service', 'Bathrobe & Slippers', 'Pillow Menu'],
      },
      {
        type: 'studio',
        name: 'Family Studio',
        description: 'Designed for families, this spacious studio includes a kitchenette and dedicated children sleeping area.',
        basePrice: 310,
        maxAdults: 2,
        maxChildren: 3,
        sizeM2: 55,
        beds: [{ type: 'queen', count: 1 }, { type: 'bunk', count: 1 }],
        totalRooms: 15,
        amenities: ['Free Wi-Fi', 'Two Flat-Screen TVs', 'Kitchenette', 'Dining Table', 'Sofa', 'Children Play Corner', 'Crib on Request', 'Air Conditioning', 'Safe'],
      },
      {
        type: 'penthouse',
        name: 'Executive Penthouse',
        description: 'The pinnacle of luxury — a full-floor penthouse with private terrace, plunge pool, and 360° skyline views.',
        basePrice: 780,
        maxAdults: 4,
        maxChildren: 2,
        sizeM2: 110,
        beds: [{ type: 'king', count: 2 }],
        totalRooms: 4,
        amenities: ['Free Wi-Fi', 'Private Terrace', '85" 8K TV', 'Full Bar', 'Chef-Ready Kitchen', 'Personal Butler', 'Jacuzzi & Plunge Pool', 'Sauna', 'Express Check-In/Out', 'VIP Airport Transfer', 'Complimentary Minibar'],
      },
      {
        type: 'villa',
        name: 'Presidential Villa',
        description: 'An exclusive private villa offering an entire estate experience — the ultimate in multi-generational luxury travel.',
        basePrice: 1450,
        maxAdults: 6,
        maxChildren: 4,
        sizeM2: 220,
        beds: [{ type: 'king', count: 3 }, { type: 'double', count: 1 }],
        totalRooms: 2,
        amenities: ['Free Wi-Fi', 'Private Pool', 'Private Garden', 'Full Kitchen', 'Home Theater', 'Staff Quarters', 'Daily Housekeeping', 'Personal Concierge', 'Helipad Access', 'Wine Cellar', 'Gym Equipment', 'Dedicated Security'],
      },
    ],
  
    // ─────────────────────────────────────────────────────────────────────────
    // CONVERSATION SUBJECTS
    // ─────────────────────────────────────────────────────────────────────────
    CONVERSATION_SUBJECTS: [
      'Check-in inquiry',
      'Late arrival notice',
      'Room preference request',
      'Dietary requirements',
      'Birthday celebration setup',
      'Airport transfer request',
      'Spa booking assistance',
      'Parking inquiry',
      'Name correction on booking',
      'Pet policy question',
      'Early check-in request',
      'Extra bed request',
      'Noise complaint',
      'Lost & found',
      'Invoice request',
      'Room upgrade inquiry',
      'Special occasion planning',
      'Wi-Fi connectivity',
      'Restaurant reservation',
      'Laundry service',
      'Business center access',
      'Concierge assistance',
      'Checkout extension',
      'Loyalty program inquiry',
      'Group booking modifications',
    ],
  
    // ─────────────────────────────────────────────────────────────────────────
    // GUEST OPENING MESSAGES (conversation starters)
    // ─────────────────────────────────────────────────────────────────────────
    GUEST_OPENING_MESSAGES: [
      'Hello! I have a booking coming up and wanted to ask a few questions about check-in.',
      'Hi there, I just completed my reservation. Could you let me know the earliest possible check-in time?',
      'Good morning! I\'m arriving late — around midnight. Is late check-in available?',
      'Hi, I\'d like to request a room on a high floor with a good view if possible.',
      'Hello, I have a special dietary requirement for breakfast. Is the kitchen able to accommodate gluten-free meals?',
      'Hi! Could you arrange a birthday cake in the room as a surprise for my partner?',
      'I\'m arriving by car. Does the hotel have parking available and what is the daily rate?',
      'Good afternoon! I\'d like to know more about the spa services and whether I need to book in advance.',
      'Hi, I noticed my booking confirmation has a slightly wrong spelling of my name. Can you fix this?',
      'Hello — I\'m travelling with my dog. Could you confirm the pet policy and any associated fees?',
      'We\'re looking forward to our stay next month. Could you recommend the best restaurants nearby?',
      'I have mobility issues. Are your rooms accessible and do you have special accommodations?',
      'Hi, is it possible to request a quiet room away from the elevators?',
      'I\'d like to arrange a car service to the airport. What are the costs?',
      'Could you provide information about your fitness facilities and their hours of operation?',
    ],
  
    // ─────────────────────────────────────────────────────────────────────────
    // STAFF RESPONSES
    // ─────────────────────────────────────────────────────────────────────────
    STAFF_RESPONSES: [
      'Thank you for reaching out! I\'d be happy to assist. What specific information can I help you with?',
      'Welcome! We\'re thrilled to have you joining us soon. I\'ll look into your request right away.',
      'Of course — late check-in is absolutely available. Our front desk is staffed 24 hours a day. Please let us know your estimated arrival time.',
      'I\'ve noted your preference for a high-floor room with a great view. I\'ll flag this for our reservations team.',
      'Our kitchen is fully capable of preparing gluten-free options. Please remind us of your requirement at check-in.',
      'What a wonderful idea! We would be delighted to arrange a birthday surprise. Could you let me know your preferences?',
      'We have secure on-site valet parking available at $45 per night. Self-parking is also available at $32 per night.',
      'Our spa is very popular and advance booking is strongly recommended, especially on weekends.',
      'I\'ve updated the name on your booking and a corrected confirmation will be emailed within the hour.',
      'We welcome well-behaved dogs in our pet-friendly rooms. There is a one-time cleaning fee of $75.',
      'Absolutely! I can provide recommendations for excellent restaurants within walking distance of the hotel.',
      'Yes, our rooms have wheelchair access and we offer several accessible features. We\'ll ensure you have the best accommodation.',
      'I\'ve made a note about your preference for a quiet room. We\'ll do our best to accommodate this upon arrival.',
      'Yes, we offer complimentary airport car service for stays over 3 nights. For other guests, it\'s $80 each way.',
      'Our fitness center is open 24/7 and is fully equipped with cardio, weights, and yoga facilities.',
    ],
  
    // ─────────────────────────────────────────────────────────────────────────
    // GUEST FOLLOW-UP MESSAGES
    // ─────────────────────────────────────────────────────────────────────────
    GUEST_FOLLOW_UPS: [
      'That\'s really helpful, thank you! One more question — is there a gym on-site?',
      'Perfect, that\'s exactly what I needed to know. Really appreciate the quick response.',
      'Great! Could you also arrange an airport pickup for our arrival on Saturday morning?',
      'Wonderful — thank you so much. See you on the 15th!',
      'That works perfectly. I\'ll make sure to mention it at check-in. Thanks!',
      'Thank you! Also, do you know if there\'s a supermarket nearby within walking distance?',
      'Lovely, I appreciate it! We\'re really looking forward to our stay.',
      'Perfect — could you add both options to our reservation notes just in case?',
      'Thank you so much for the quick response. Everything is clear now.',
      'Great, I appreciate it! One last thing — is breakfast included in the rate or billed separately?',
      'Excellent — just what we needed. This is going to be an amazing trip!',
      'Perfect service! We can\'t wait to arrive. Everything is confirmed.',
      'Thanks for sorting this out so quickly. See you soon!',
      'Brilliant! That really helps us plan our activities. Looking forward to it!',
      'You\'ve been incredibly helpful. Our family is excited to stay with you!',
    ],
  
    // ─────────────────────────────────────────────────────────────────────────
    // STAFF CLOSING MESSAGES
    // ─────────────────────────────────────────────────────────────────────────
    STAFF_CLOSINGS: [
      'Yes, we have a fully equipped fitness center open 24/7 on the 3rd floor.',
      'You\'re very welcome! We look forward to welcoming you.',
      'Absolutely — I\'ve arranged a complimentary airport pickup on Saturday morning.',
      'We look forward to your arrival and hope to make your stay truly memorable.',
      'Perfect — we\'ll have everything ready. Safe journey!',
      'There\'s a supermarket about 5 minutes\' walk from the main entrance.',
      'We can\'t wait to welcome you! If anything else comes to mind, please don\'t hesitate to reach out.',
      'I\'ve added both notes to your reservation. You\'re all set!',
      'Our pleasure entirely. We\'ll see you soon — have a wonderful trip!',
      'Breakfast is available as a paid option at $28 per person, buffet style from 6:30-10:30 AM.',
      'We truly look forward to welcoming you to our hotel. See you very soon!',
      'Thank you for choosing us — we promise an exceptional experience.',
      'Everything is confirmed and ready for your arrival. Safe travels!',
      'We can\'t wait to host you and your family. See you shortly!',
      'Your reservation is confirmed and we\'ll have a warm welcome ready for you!',
    ],
  
    // ─────────────────────────────────────────────────────────────────────────
    // REVIEW TEMPLATES (rating + travel type)
    // ─────────────────────────────────────────────────────────────────────────
    REVIEW_TEMPLATES: [
      {
        rating: 5,
        travelType: 'couple',
        title: 'Absolutely magical stay!',
        comment: 'From the moment we arrived, every detail was handled with care and elegance. The room was immaculate, the bed incredibly comfortable, and the view took our breath away each morning. The staff went above and beyond — our concierge arranged a surprise anniversary setup that we will never forget. Dining here was a culinary journey, with each course better than the last. We have stayed at many five-star hotels, and this is undeniably among the finest. We are already planning our return visit.',
      },
      {
        rating: 5,
        travelType: 'business',
        title: 'Perfect for business travelers',
        comment: 'I travel extensively for work and have stayed at hundreds of hotels worldwide. This property stands out for its seamless business amenities — fast, reliable Wi-Fi throughout, an executive lounge with excellent coffee, and a workspace that actually helped me be productive. Check-in was swift, the room quiet, and the express checkout saved me precious time. The restaurant served breakfast early enough for early-morning meetings. Will book again without hesitation.',
      },
      {
        rating: 4,
        travelType: 'family',
        title: 'Wonderful family getaway',
        comment: 'We came as a family of five and were pleasantly surprised by how well the hotel caters to children. The family room was spacious with plenty of room for kids to spread out. Staff were patient and genuinely kind to our little ones. The pool was a highlight — our kids spent hours there. The service was excellent and everyone felt welcome. A truly enjoyable stay that we would recommend to other families.',
      },
      {
        rating: 5,
        travelType: 'solo',
        title: 'A solo traveler\'s dream',
        comment: 'Traveling alone can sometimes feel lonely at a large hotel, but the staff here made me feel genuinely welcomed. Every person I encountered greeted me by name after the first day — a small detail that made a huge difference. The solo dining experience was handled graciously. My room had everything I needed: a great reading lamp, a comfortable desk, fast internet, and a pillow menu. Exceptional value.',
      },
      {
        rating: 4,
        travelType: 'couple',
        title: 'Romantic and refined',
        comment: 'We chose this hotel for our anniversary and it delivered on romance beautifully. Candles and rose petals were arranged in the room as requested, and the spa couple\'s package was divine. The in-room dining menu had excellent options for a cozy evening. Everything else was impeccable, though the bathroom could use a minor refresh. That said, the service and food were exceptional.',
      },
      {
        rating: 3,
        travelType: 'business',
        title: 'Good but room for improvement',
        comment: 'The location is excellent and the lobby makes a strong first impression. My room, however, did not quite match the premium price point. Air conditioning was noisy and disrupted my sleep. I reported it and maintenance came quickly, but the fix only partially solved the issue. The restaurant lunch menu was limited. On the positive side, the bed was comfortable and housekeeping was thorough.',
      },
      {
        rating: 5,
        travelType: 'group',
        title: 'Outstanding group experience',
        comment: 'We organized a corporate retreat for 12 people here and the events team was superb. Every room was ready on time, the conference facilities were state-of-the-art, and the catering manager accommodated all dietary restrictions without fuss. The team dinner on the final evening was exceptional. Managing group logistics is stressful, but this hotel\'s professionalism made it effortless. Already booked for next year!',
      },
      {
        rating: 4,
        travelType: 'solo',
        title: 'Relaxing and well-located',
        comment: 'A solid choice for a relaxing solo break. The spa is genuinely world-class — I booked a deep tissue massage and left feeling completely rejuvenated. The pool area is serene in the morning. My standard room was clean and tastefully decorated. I found the in-room coffee selection disappointing for the price tier. Room service arrived promptly and the food was hot. Would return.',
      },
      {
        rating: 2,
        travelType: 'couple',
        title: 'Disappointing — not what we expected',
        comment: 'We had high expectations based on the reviews, but our stay fell short. We were assigned a room facing the service entrance rather than the advertised view. When we queried this at reception, we were told upgrades were unavailable. The room was also noticeably smaller than shown online. Our dinner reservation was lost in the system, causing a 40-minute delay. Management did apologize and offer a partial refund on dining, which we appreciated. The bed and linens were genuinely comfortable.',
      },
      {
        rating: 5,
        travelType: 'family',
        title: 'Best family hotel we\'ve visited',
        comment: 'We have been traveling with young children for five years and this is by far the most family-friendly luxury hotel we have experienced. The welcome kit for our kids included puzzles, crayons, and local activity guides tailored to their ages — a thoughtful touch. The children\'s pool area is fenced and supervised. Kids\' menus at all restaurants were creative and nutritious. Our suite had a separate sleeping area for the kids which made bedtime easier. The concierge organized a wonderful day trip. Genuinely impressive.',
      },
    ],
  
    // ─────────────────────────────────────────────────────────────────────────
    // HOTEL RESPONSE TEMPLATES (for reviews)
    // ─────────────────────────────────────────────────────────────────────────
    HOTEL_RESPONSES: [
      'Thank you sincerely for your kind words. It was our honour to host you and we look forward to welcoming you back very soon.',
      'We are delighted to hear you enjoyed your stay. Your feedback means the world to our team and we\'ll make sure to pass on your compliments.',
      'Thank you for taking the time to share your experience. We appreciate your honest feedback and will use it to continue improving.',
      'What a wonderful review! We hope to see you again soon — there is always something special waiting for you here.',
      'Thank you! Comments like yours remind us why we love what we do. We hope your next visit is even more memorable.',
      'We\'re so glad you had a positive experience. Your satisfaction is our highest priority and we can\'t wait to welcome you back.',
      'It was truly our pleasure to host you. We appreciate you choosing us and hope you\'ll return soon.',
      'Thank you for this lovely feedback. We\'re committed to maintaining the high standards you\'ve come to expect.',
      'We appreciate your kind words and look forward to your next visit. See you soon!',
      'Your satisfaction means everything to us. We can\'t wait to welcome you back to our hotel family!',
    ],
  
    // ─────────────────────────────────────────────────────────────────────────
    // SPECIAL REQUESTS (guest preferences)
    // ─────────────────────────────────────────────────────────────────────────
    SPECIAL_REQUESTS: [
      'Non-smoking room please',
      'Extra pillows',
      'Early check-in if possible',
      'Quiet room away from elevator',
      'High floor preferred',
      'Ground floor room',
      'Room away from street noise',
      'Hypoallergenic pillows',
      'Extra towels',
      'Baby cot needed',
      'Accessible room with grab bars',
      'Refrigerator in room',
      'No housekeeping in morning',
      'Coffee/tea maker in room',
      'Late checkout if available',
    ],
  
    // ─────────────────────────────────────────────────────────────────────────
    // DEMAND PROFILES (seasonal pricing)
    // ─────────────────────────────────────────────────────────────────────────
    DEMAND_PROFILES: [
      { month: 1, seasonScore: 0.6, baseDemand: 0.55 },
      { month: 2, seasonScore: 0.65, baseDemand: 0.58 },
      { month: 3, seasonScore: 0.75, baseDemand: 0.68 },
      { month: 4, seasonScore: 0.8, baseDemand: 0.72 },
      { month: 5, seasonScore: 0.85, baseDemand: 0.78 },
      { month: 6, seasonScore: 0.95, baseDemand: 0.88 },
      { month: 7, seasonScore: 1.0, baseDemand: 0.95 },
      { month: 8, seasonScore: 1.0, baseDemand: 0.92 },
      { month: 9, seasonScore: 0.85, baseDemand: 0.80 },
      { month: 10, seasonScore: 0.80, baseDemand: 0.75 },
      { month: 11, seasonScore: 0.70, baseDemand: 0.65 },
      { month: 12, seasonScore: 0.90, baseDemand: 0.85 },
    ],
  };