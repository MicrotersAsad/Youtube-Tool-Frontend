export async function apiClient(req, endpoint, options = {}) {
    // Request থেকে baseUrl ডাইনামিকভাবে বের করুন
    const protocol = req.headers['x-forwarded-proto'] || 'http'; // যদি HTTPS থাকে
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;
  
    const token = process.env.AUTH_TOKEN; // টোকেন
  
    // হেডার তৈরি
    const headers = {
      Authorization: `Bearer ${token}`, // টোকেন
      'Content-Type': 'application/json',
      ...options.headers, // কাস্টম হেডার (যদি থাকে)
    };
  
    // পুরো URL ধরার জন্য, baseUrl-সহ endpoint যুক্ত করুন
    const apiUrl = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  
    // API কল
    const response = await fetch(apiUrl, {
      ...options,
      headers,
    });
  
    // যদি রেসপন্স সফল না হয়, ত্রুটি দেখান
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API রিকোয়েস্ট ব্যর্থ হয়েছে');
    }
  
    // JSON ডেটা ফেরত দিন
    return response.json();
  }
  