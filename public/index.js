
import React, { useEffect, useState, memo, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import AOS from 'aos';
import 'aos/dist/aos.css'; // AOS CSS for animations
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import 'react-medium-image-zoom/dist/styles.css'; // Zoom library CSS
import { useRouter } from 'next/router';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'; // Skeleton styles

// Lazy load components for performance optimization
const Slider = dynamic(() => import('react-slick'), { ssr: false });
const Modal = dynamic(() => import('react-modal'), { ssr: false });
const Zoom = dynamic(() => import('react-medium-image-zoom'), { ssr: false });

const Home = ({ appData }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [popupIsOpen, setPopupIsOpen] = useState(false);
  const router = useRouter();


 

  // Function to check if the popup was previously closed
  const checkIfPopupClosed = () => {
    return localStorage.getItem('popupClosed') === 'true';
  };
  useEffect(() => {
    AOS.init({
      duration: 1500,  // Animation duration
      easing: 'ease-in-out', // Smooth easing effect
      once: true,  // Animate only once
    });
    
    const timer = setTimeout(() => setIsLoading(false), 1000);

    // Show the popup after 2 seconds if it hasn't been closed before
    const popupTimer = setTimeout(() => {
      if (!checkIfPopupClosed()) {
        setPopupIsOpen(true);
      }
    }, 2000); // Delay of 2 seconds

    return () => {
      clearTimeout(timer);
      clearTimeout(popupTimer);
    };
  }, []);

  // Function to handle closing the popup
  const handleClosePopup = () => {
    setPopupIsOpen(false);
    localStorage.setItem('popupClosed', 'true'); // Mark popup as closed
  };
  return (
    <div>
    {/* Popup Image Modal */}
    {appData.popupEnabled && appData.popupImageUrl ? (
      <Modal
        isOpen={popupIsOpen}
        onRequestClose={handleClosePopup}
        contentLabel="Popup Image"
        style={{
          overlay: { zIndex: 10000, backgroundColor: 'rgba(0, 0, 0, 0.8)' },
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '0',
            border: 'none',
            background: 'transparent',
          },
        }}
      >
        <div className="relative">
          <button
            onClick={handleClosePopup}
            style={{
              position: 'absolute',
              top: '0px',
              right: '10px',
              color: 'black',
              padding: '5px',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            X
          </button>
          <Image
            src={appData.popupImageUrl}
            alt="Popup Image"
            width={600}
            height={600}
            className="popup-image"
            style={{ objectFit: 'contain', borderRadius: '10px' }}
          />
        </div>
      </Modal>
    ) : (
      <Skeleton height={600} width={600} />
    )}
 
  

      {/* Skeleton for Banner Component */}
      <MemoizedBanner data={appData.bannerData} isLoading={isLoading} />

      {/* Skeleton for Info Section */}
      <MemoizedInfoSection data={appData.heroArea} isLoading={isLoading} />

      {/* Skeleton for About Section */}
      <MemoizedAboutSection data={appData.aboutSection} isLoading={isLoading} />

      {/* Skeleton for Courses Section */}
      <MemoizedCoursesSection data={appData.ourCourses} isLoading={isLoading} />

      {/* Skeleton for Statistics Section */}
      <MemoizedStatistics data={appData.counters} isLoading={isLoading} />

      {/* Skeleton for Notices and Blogs */}
      <MemoizedNoticesAndBlogs notices={appData.notices} blogs={appData.blogs} isLoading={isLoading} />

      {/* Skeleton for Why Choose ANC Section */}
      <MemoizedWhyChooseANC data={appData.whyChooseANC} isLoading={isLoading} />

      {/* Skeleton for Photo Gallery */}
      <MemoizedPhotoGallery data={appData.photos} isLoading={isLoading} />
    </div>
  );
};

const MemoizedBanner = memo(({ data, isLoading }) => {
  if (isLoading) {
    return <Skeleton height={400} />;
  }

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: true,
  };

  return (
    <div className="banner-container">
      <Slider {...settings}>
        {data.map((slider, index) => (
          <div key={index} className="relative overflow-hidden  h-[500px] md:h-[600px]">
            {/* Background Image with overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center z-0 brightness-[20%]"
              style={{ backgroundImage: `url(${slider.img})` }}
            ></div>

           {/* Content Container */}
           <div className="relative z-10 flex flex-col justify-center items-center md:items-start md:ms-80 px-4 max-w-4xl h-full">
              <h1 
                data-aos="fade-up" 
                className="text-3xl md:text-5xl text-white font-bold mb-2 md:mb-4 ms:text-center md:text-left shadow-md break-words leading-tight"
              >
                {slider.heading}
              </h1>
              <p 
                data-aos="fade-up" 
                className="text-base md:text-lg lg:text-xl text-white mb-4 md:mb-6 ms:text-center md:text-left shadow-md break-words leading-normal"
              >
                {slider.subHeading}
              </p>
              {slider.buttonLink && slider.buttonText && (
                <Link href={slider.buttonLink} passHref>
                  <button className="bg-blue-600 text-white rounded px-3 py-2 md:px-5 md:py-3 hover:bg-blue-700 transition duration-300 ease-in-out">
                    {slider.buttonText}
                  </button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
});


// Skeleton loading for Info Section
const MemoizedInfoSection = memo(({ data, isLoading }) => {
  if (isLoading) {
    return <Skeleton count={4} height={200} />;
  }

  return (
    <div className="w-full h-auto info">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" data-aos="fade-up">
        {data.map((hero, index) => (
          <div key={index} className={`p-6 ${index % 2 === 0 ? 'bg-[#0d1128]' : 'bg-blue-800'} text-white`}>
            <div className="flex justify-center m-4">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 20l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12l9-5-9-5-9 5z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-center mb-3">{hero.title}</h3>
            <p className="text-center text-gray-300">{hero.description}</p>
            <div className="flex justify-center m-4">
              <Link href={hero.buttonLink || '/'} passHref>
                <span className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300">
                  {hero.buttonText || 'Learn More'}
                </span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
const MemoizedAboutSection = memo(({ data, isLoading }) => (
  <div className="max-w-7xl mx-auto bg-white py-12 px-4 md:px-10">
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row-reverse items-center justify-between gap-8">
      {/* Image comes first on mobile, last on desktop */}
      <div data-aos="fade-up" className="lg:w-1/2">
        {isLoading ? (
          <Skeleton width={500} height={500} /> // Skeleton for image
        ) : (
          <Image
            src={data.aboutImageUrl || '/default-about-image.png'}
            alt="Art Nursing College Campus"
            width={500}
            height={500}
            className="w-full h-auto object-cover"
          />
        )}
      </div>
      
      {/* Text content */}
      <div className="lg:w-1/2 mt-5 mb-5 text-left" data-aos="fade-up">
        {isLoading ? (
          <>
            <Skeleton width={300} height={30} /> {/* Skeleton for heading */}
            <Skeleton count={5} /> {/* Skeleton for description */}
            <Skeleton width={100} height={30} style={{ marginTop: '20px' }} /> {/* Skeleton for button */}
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold mb-4">
              {data.headline || 'About Art Nursing College'}
            </h2>
            <div className="result-content" dangerouslySetInnerHTML={{ __html: data.description }} />
            <Link href={data.buttonLink}>
              <span className="inline-block px-4 py-2 mt-5 bg-red-500 text-white text-sm font-semibold rounded hover:bg-red-600 transition duration-300">
                Know More
              </span>
            </Link>
          </>
        )}
      </div>
    </div>
  </div>
));
const MemoizedCoursesSection = memo(({ data, isLoading }) => (
  <div className="max-w-7xl mx-auto py-12">
    <h2 className="text-3xl font-bold text-center mb-5" data-aos="fade-up">Our Courses</h2>
    <p className="text-xl text-center ms-5 pb-8" data-aos="fade-up">
      Discover a diverse selection of courses crafted to boost your skills and knowledge.
      <br /> Empower your future with expert-led training designed to inspire growth and success.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {isLoading ? (
        // Show Skeleton while loading
        Array(3)
          .fill(0)
          .map((_, index) => (
            <div
              key={index}
              className="bg-blue-900 text-white p-6 rounded-lg text-center pt-14 pb-14"
              data-aos="fade-up"
            >
              <div className="mb-4">
                <Skeleton circle={true} width={48} height={48} className="mx-auto" /> {/* Skeleton for icon */}
              </div>
              <h3 className="text-xl font-semibold mb-2">
                <Skeleton width={150} /> {/* Skeleton for course heading */}
              </h3>
              <p>
                <Skeleton count={3} /> {/* Skeleton for course description */}
              </p>
              <Skeleton width={120} height={40} className="mt-4" /> {/* Skeleton for button */}
            </div>
          ))
      ) : data.length > 0 ? (
        data.map((course, index) => (
          <div
            key={index}
            className="bg-blue-900 text-white p-6 rounded-lg text-center pt-14 pb-14"
            data-aos="fade-up"
            data-aos-delay={index * 50}
          >
            <div className="mb-4">
              <Image
                src={course.iconUrl}
                alt={course.heading}
                className="w-12 h-12 mx-auto"
                width={24}
                height={24}
                layout="intrinsic"
                priority
              />
            </div>
            <h3 className="text-xl font-semibold mb-2">{course.heading}</h3>
            <p>{course.description}</p>
            <Link href={course.buttonLink || '#'}>
              <p className="mt-4 inline-block px-6 py-2 bg-[#F4A139] text-white font-semibold rounded-md">
                {course.buttonText || 'Read More'}
              </p>
            </Link>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-700">No courses available at the moment.</p>
      )}
    </div>
  </div>
));
// Statistics Component with Skeleton
const MemoizedStatistics = memo(({ data, isLoading }) => (
  <div className="pt-5 pb-5 bg-gray-100 flex flex-col justify-center items-center px-4">
    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 mt-5 mb-5 md:mb-5 text-center" data-aos="fade-up">
      Our Community Statistics
    </h1>
    <p className="text-xl text-center ms-5 pb-8" data-aos="fade-up">
      Our community is continuously growing, bringing together learners and professionals from diverse backgrounds.
      <br />
      Together, we are building a space for collaboration, shared learning, and success.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-12 w-full h-auto max-w-7xl">
      {isLoading ? (
        Array(3)
          .fill(0)
          .map((_, index) => (
            <div key={index} className="p-6 md:p-12 bg-white rounded-2xl w-full h-auto mx-auto max-w-md md:max-w-lg">
              <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6 text-gray-700 text-center">
                <Skeleton width={150} />
              </h2>
              <div className="text-center">
                <Skeleton width={80} height={50} />
              </div>
            </div>
          ))
      ) : (
        data.map((counter, index) => (
          <div
            key={index}
            data-aos="fade-up"
            className="p-6 md:p-12 bg-white rounded-2xl w-full h-auto mx-auto max-w-md md:max-w-lg"
          >
            <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6 text-gray-700 text-center">
              {counter.headline}
            </h2>
            <div className="text-center">
              <span className="text-4xl md:text-7xl font-extrabold text-blue-600">{counter.counter}+</span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
));

// Notices and Blogs Component with Skeleton
const MemoizedNoticesAndBlogs = memo(({ notices, blogs, isLoading }) => {
  const [searchTermNotices, setSearchTermNotices] = useState('');
  const [searchTermBlogs, setSearchTermBlogs] = useState('');

  const filteredNotices = notices?.filter((notice) =>
    notice?.title.toLowerCase().includes(searchTermNotices.toLowerCase())
  );

  const filteredBlogs = blogs.filter((blog) =>
    blog.title.toLowerCase().includes(searchTermBlogs.toLowerCase())
  );

  const displayedNotices = filteredNotices.slice(0, 5);
  const displayedBlogs = filteredBlogs.slice(0, 5);

  return (
    <div className="w-full bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notices Section */}
        <div className="bg-white p-6 shadow-md rounded-lg" data-aos="fade-up">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Existing Notices</h2>
          <input
            type="text"
            placeholder="Search notices..."
            className="w-full mb-4 p-2 border border-gray-300 rounded-md"
            value={searchTermNotices}
            onChange={(e) => setSearchTermNotices(e.target.value)}
          />
          {isLoading ? (
            Array(5)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="flex items-center mb-4">
                  <Skeleton circle={true} height={64} width={64} />
                  <div className="ml-4">
                    <Skeleton width={200} />
                  </div>
                </div>
              ))
          ) : filteredNotices.length === 0 ? (
            <div className="text-center py-4 text-gray-600">No notices available.</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="max-h-100 overflow-y-auto">
                {displayedNotices.map((notice) => (
                  <div key={notice._id} className="flex items-center mb-4">
                    {/* Date Box */}
                    <div className="flex flex-col items-center justify-center text-white rounded-md overflow-hidden w-20 h-20">
                      <div className="bg-blue-900 w-full h-auto text-center py-1 text-3xl font-bold">
                        {new Date(notice.date).getDate()}
                      </div>
                      <div className="bg-blue-500 w-full h-auto text-center py-1 text-xs">
                        {new Date(notice.date).toLocaleString('default', { month: 'short' })}-
                        {new Date(notice.date).getFullYear()}
                      </div>
                    </div>
                    {/* Notice Title */}
                    <div className="ml-4">
                      <Link
                        href={`notices/${notice?.slug}`}
                        className="text-blue-600 hover:underline font-medium"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="text-blue-600 hover:underline font-medium">{notice.title}</span>
                      </Link>
                    </div>
                  </div>
                ))}
                {/* Show a scroll bar if more than 5 notices */}
                {filteredNotices.length > 5 && <div className="text-center text-gray-500 mt-2">Scroll for more...</div>}
              </div>
            </div>
          )}
        </div>

        {/* Blogs Section */}
        <div className="bg-white p-6 shadow-md rounded-lg" data-aos="fade-up">
          <h2 className="text-xl font-semibold mb-4">Latest Blogs</h2>
          <input
            type="text"
            placeholder="Search blogs..."
            className="w-full mb-4 p-2 border border-gray-300 rounded-md"
            value={searchTermBlogs}
            onChange={(e) => setSearchTermBlogs(e.target.value)}
          />
          {isLoading ? (
            Array(5)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="flex items-center mb-4">
                  <Skeleton circle={true} height={64} width={64} />
                  <div className="ml-4">
                    <Skeleton width={200} />
                  </div>
                </div>
              ))
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center py-4 text-gray-600">No blogs available.</div>
          ) : (
            <div className="max-h-100 overflow-y-auto">
              {displayedBlogs.map((blog) => (
                <div key={blog._id} className="flex items-center mb-4">
                  {/* Date Box */}
                  <div className="flex flex-col items-center justify-center text-white rounded-md overflow-hidden w-20 h-20">
                      <div className="bg-blue-900 w-full h-auto text-center py-1 text-3xl font-bold">
                        {new Date(blog.createdAt).getDate()}
                      </div>
                      <div className="bg-blue-500 w-full h-auto text-center py-1 text-xs">
                        {new Date(blog.createdAt).toLocaleString('default', { month: 'short' })}-
                        {new Date(blog.createdAt).getFullYear()}
                      </div>
                    </div>
                  {/* Blog Title */}
                  <div className="ml-4">
                    <Link href={`/blog/${blog.slug}`} passHref>
                      <span className="text-blue-600 hover:underline font-medium">{blog.title}</span>
                    </Link>
                  </div>
                </div>
              ))}
              {/* Show a scroll bar if more than 5 blogs */}
              {filteredBlogs.length > 5 && <div className="text-center text-gray-500 mt-2">Scroll for more...</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Why Choose ANC Component with Skeleton
const MemoizedWhyChooseANC = memo(({ data, isLoading }) => (
  <div className="w-full bg-gray-200 py-12">
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-5 mt-5" data-aos="fade-up">Why Choose ANC</h2>
      <p className="text-xl text-center ms-5 pb-8" data-aos="fade-up">
        Choosing ANC means joining a trusted partner committed to your success. With innovative solutions,
        <br />
        expert support, and a focus on delivering excellence, we help you achieve your goals every step of the way.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array(3)
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  className={`bg-white p-10 rounded-lg shadow-md flex items-center ${
                    index % 2 === 0 ? 'bg-[#0d1128]' : 'bg-blue-800'
                  } text-black`}
                  data-aos={index % 2 === 0 ? 'fade-right' : 'fade-left'}
                >
                  <div className="mr-4">
                    <Skeleton width={128} height={128} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      <Skeleton width={100} />
                    </h3>
                    <p>
                      <Skeleton count={3} />
                    </p>
                  </div>
                </div>
              ))
          : data.map((item, index) => (
              <div
                key={index}
                className={`bg-white p-10 rounded-lg shadow-md flex items-center ${
                  index % 2 === 0 ? 'bg-[#0d1128]' : 'bg-blue-800'
                } text-black`}
                data-aos={index % 2 === 0 ? 'fade-up' : 'fade-up'}
              >
                <div className="mr-4">
                  <Image
                    src={item?.iconUrl}
                    alt="Logo"
                    width={128}
                    height={128}
                    className="icon-logo"
                    layout="intrinsic"
                    priority
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{item.heading}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
      </div>
    </div>
  </div>
));

// Photo Gallery Component with Skeleton
const MemoizedPhotoGallery = ({ data, isLoading }) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // Selected image to show in modal
  const [modalIndex, setModalIndex] = useState(0); // Track index for modal slider

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  const openModal = (image, index) => {
    setSelectedImage(image); // Set the selected image
    setModalIndex(index); // Set the index of the clicked image
    setModalIsOpen(true); // Open the modal
    document.body.style.overflow = 'hidden'; // Prevent page scrolling when modal is open
  };

  const closeModal = () => {
    setModalIsOpen(false); // Close the modal
    document.body.style.overflow = 'auto'; // Restore page scrolling when modal is closed
  };

  const modalSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    initialSlide: modalIndex, // Start from clicked image
    slidesToShow: 1,
    slidesToScroll: 1,
    afterChange: (current) => setModalIndex(current), // Update index when slide changes
  };

  return (
    <div>
      {/* Main gallery slider */}
      {isLoading ? (
        <Skeleton count={4} height={300} />
      ) : (
        <Slider {...settings}>
          {data.slice(0, 8).map((photo, index) => (
            <div key={index} onClick={() => openModal(photo.img, index)}>
              <Image
                width={500}
                height={400}
                src={photo.img}
                alt={`Photo ${index}`}
                style={{ width: '100%', height: '300px', objectFit: 'cover', cursor: 'pointer' }}
              />
            </div>
          ))}
        </Slider>
      )}

      {/* Modal to display the clicked image with slider */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Image Modal"
        shouldCloseOnOverlayClick={true} // Allow modal to close on overlay click
        style={{
          overlay: { zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.8)' },
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '90%',
            maxHeight: '90vh', // Use full height of viewport
            padding: 0, // Remove padding to fit content
            overflow: 'hidden', // Hide overflow
          },
        }}
      >
        {selectedImage && (
          <div>
            <Slider {...modalSettings}>
              {data.map((photo, index) => (
                <div key={index}>
                  <Zoom>
                    <Image
                      width={1000}
                      height={600}
                      src={photo.img}
                      alt={`Modal Image ${index}`}
                      layout="intrinsic"
                      objectFit="contain"
                      priority={index === 0} // প্রথম ইমেজকে দ্রুত লোড করতে (অপশনাল)
                      className="w-full h-auto"
                    />
                  </Zoom>
                </div>
              ))}
            </Slider>

            {/* Close button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'red',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                cursor: 'pointer',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
// Fetching data server-side using getStaticProps
export async function getServerSideProps(context) {
  const { req } = context;

  // ডাইনামিকভাবে হোস্ট পেতে req.headers.host ব্যবহার করুন
  const protocol = req.headers['x-forwarded-proto'] || 'http'; // প্রোডাকশন হলে https, নাহলে http
  const host = req.headers.host; // হোস্টের ডাইনামিক URL

  // ডাইনামিক হোস্ট ব্যবহার করে API কল করা
  const [bannerData, settingData, photoGalleryData, noticesData, blogsData] = await Promise.all([
    fetch(`${protocol}://${host}/api/banner`).then(res => res.json()),
    fetch(`${protocol}://${host}/api/setting`).then(res => res.json()),
    fetch(`${protocol}://${host}/api/photo-gallery`).then(res => res.json()),
    fetch(`${protocol}://${host}/api/notice`).then(res => res.json()),
    fetch(`${protocol}://${host}/api/blogs`).then(res => res.json())
  ]);


  return {
    props: {
      appData: {
        bannerData: bannerData || [],
        aboutSection: settingData.aboutSection || {},
        ourCourses: settingData.ourCourses || [],
        heroArea: settingData.heroArea || [],
        counters: settingData.counters || [],
        notices: noticesData || [],
        blogs: blogsData || [],
        whyChooseANC: settingData.whyChooseANC || [],
        photos: photoGalleryData || [],
        popupEnabled: settingData.popupEnabled || false,
        popupImageUrl: settingData.popupImageUrl || '',
      },
    },
  };
}




export default Home;
