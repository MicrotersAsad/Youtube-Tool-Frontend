/* eslint-disable react/no-unescaped-entities */
import Head from "next/head";
import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FaEye, FaEyeSlash, FaStar } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../contexts/AuthContext";
import Image from "next/image";
import { format } from "date-fns";
import { useRouter } from "next/router";
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { i18n, useTranslation } from "next-i18next";
import Link from "next/link";
import dynamic from "next/dynamic";
import Script from "next/script";
const StarRating = dynamic(() => import("./StarRating"), { ssr: false });

const YouTubeDescriptionGenerator = ({ meta = [], faqs = [], relatedTools = [], existingContent = "" }) => {
  const { user, updateUserProfile } = useAuth();
  const { t } = useTranslation('description');
  const [openIndex, setOpenIndex] = useState(null);
  const [videoInfo, setVideoInfo] = useState({
    aboutVideo: t("Welcome to [Your Channel Name]!\n\nIn this video, we're diving deep into the world of Full Stack Development. Whether you're a beginner or an experienced developer, these tips and guidelines will help you enhance your skills and stay ahead in the tech industry."),
    timestamps: t("00:00 - Introduction\n01:00 - First Topic\n02:00 - Second Topic\n03:00 - Third Topic"),
    aboutChannel: t("Our channel is all about [Channel's Niche]. We cover a lot of cool stuff like [Topics Covered]. Make sure to subscribe for more awesome content!"),
    recommendedVideos: t("Check Out Our Other Videos:\n- [Video 1 Title](#)\n- [Video 2 Title](#)\n- [Video 3 Title](#)"),
    aboutCompany: t("Check out our company and our products at [Company Website]. We offer [Products/Services Offered]."),
    website: t("Find us at:\n[Website URL]"),
    contactSocial: t("Get in Touch with Us:\nEmail: [Your Email]\nFollow us on Social Media:\nTwitter: [Your Twitter Handle]\nLinkedIn: [Your LinkedIn Profile]\nGitHub: [Your GitHub Repository]"),
    keywords: "full stack development, coding, programming, web development",
  });

  const [sections, setSections] = useState([
    { id: "aboutVideo", title: t("About the Video"), visible: true },
    { id: "timestamps", title: t("Timestamps"), visible: true },
    { id: "aboutChannel", title: t("About the Channel"), visible: true },
    {
      id: "recommendedVideos",
      title: t("Recommended Videos/Playlists"),
      visible: true,
    },
    {
      id: "aboutCompany",
      title: t("About Our Company & Products"),
      visible: true,
    },
    { id: "website", title: t("Our Website"), visible: true },
    { id: "contactSocial", title: t("Contact & Social"), visible: true },
    { id: "keywords", title: t("Keywords to Target (Optional)"), visible: true },
  ]);
  const [translations, setTranslations] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: "",
    title: "",
    userProfile: "",
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchReviews();
  }, [i18n.language]);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=descriptionGenerator&limit=5"); // Limit initial reviews
      const data = await response.json();
      const formattedData = data.map((review) => ({
        ...review,
        createdAt: format(new Date(review.createdAt), "MMMM dd, yyyy"),
      }));
      setReviews(formattedData);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  const handleReviewSubmit = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!newReview.rating || !newReview.comment) {
      toast.error(t("All fields are required."));
      return;
    }

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool: "descriptionGenerator",
          ...newReview,
          userProfile: user?.profileImage || "not available",
          userName: user?.username,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit review");

      toast.success(t("Review submitted successfully!"));
      setNewReview({
        rating: 0,
        comment: "",
        title: "",
        userProfile: "",
      });
      setShowReviewForm(false);
      fetchReviews();
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error(t("Failed to submit review"));
    }
  };

  const calculateRatingPercentage = (rating) => {
    const totalReviews = reviews.length;
    const ratingCount = reviews.filter(
      (review) => review.rating === rating
    ).length;
    return totalReviews ? (ratingCount / totalReviews) * 100 : 0;
  };

  const overallRating = (
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  ).toFixed(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVideoInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value,
    }));
  };

  const generateDescription = () => {
    const {
      aboutVideo,
      timestamps,
      aboutChannel,
      recommendedVideos,
      aboutCompany,
      website,
      contactSocial,
      keywords,
    } = videoInfo;
    return `
${aboutVideo}

📌 **${t("Timestamps")}:**
${timestamps}

📌 **${t("About the Channel")}:**
${aboutChannel}

📌 **${t("Recommended Videos/Playlists")}:**
${recommendedVideos}

📌 **${t("About Our Company & Products")}:**
${aboutCompany}

📌 **${t("Our Website")}:**
${website}

📌 **${t("Contact & Social")}:**
${contactSocial}

🔍 **${t("Keywords to Target")}:**
${keywords}
    `;
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const newSections = Array.from(sections);
    const [movedSection] = newSections.splice(result.source.index, 1);
    newSections.splice(result.destination.index, 0, movedSection);

    setSections(newSections);
  };

  const toggleVisibility = (id) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === id ? { ...section, visible: !section.visible } : section
      )
    );
  };

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const openReviewForm = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setModalVisible(true);
  };

  const handleShowMoreReviews = async () => {
    try {
      const response = await fetch("/api/reviews?tool=descriptionGenerator");
      const data = await response.json();
      const formattedData = data.map((review) => ({
        ...review,
        createdAt: format(new Date(review.createdAt), "MMMM dd, yyyy"),
      }));
      setReviews(formattedData);
      setShowAllReviews(true);
    } catch (error) {
      console.error("Failed to fetch more reviews:", error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateDescription()).then(() => {
      toast.success(t("Copied to clipboard!"));
    }).catch(err => {
      toast.error(t("Failed to copy text."));
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <Head>
        <title>{meta?.title}</title>
        <meta name="description" content={meta?.description} />
        <meta property="og:url" content={meta?.url} />
        <meta property="og:title" content={meta?.title} />
        <meta property="og:description" content={meta?.description} />
        <meta property="og:image" content={meta?.image || ""} />
        <meta name="twitter:card" content={meta?.image || ""} />
        <meta property="twitter:domain" content={meta?.url} />
        <meta property="twitter:url" content={meta?.url} />
        <meta name="twitter:title" content={meta?.title} />
        <meta name="twitter:description" content={meta?.description} />
        <meta name="twitter:image" content={meta?.image || ""} />
        {/* - Webpage Schema */}
        <Script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: meta?.title,
            url: meta?.url,
            description: meta?.description,
            breadcrumb: {
              "@id": `${meta?.url}#breadcrumb`,
            },
            about: {
              "@type": "Thing",
              name: meta?.title,
            },
            isPartOf: {
              "@type": "WebSite",
              url: meta?.url,
            },
          })}
        </Script>
        {/* - Review Schema */}
        <Script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: meta?.title,
            url: meta?.url,
            applicationCategory: "Multimedia",
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: overallRating,
              ratingCount: reviews?.length,
              reviewCount: reviews?.length,
            },
            review: reviews.map((review) => ({
              "@type": "Review",
              author: {
                "@type": "Person",
                name: review.userName,
              },
              datePublished: review.createdAt,
              reviewBody: review.comment,
              name: review.title,
              reviewRating: {
                "@type": "Rating",
                ratingValue: review.rating,
              },
            })),
          })}
        </Script>
        {/* - FAQ Schema */}
        <Script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          })}
        </Script>
        {translations && Object.keys(translations).map(lang => (
          <link
            key={lang}
            rel="alternate"
            href={`${meta?.url}?locale=${lang}`}
            hrefLang={lang} // Corrected property name
          />
        ))}
      </Head>
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4 text-center">
        {t("YouTube Description Generator")}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {sections.map(({ id, title, visible }, index) => (
                    <Draggable key={id} draggableId={id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-4 border p-4 rounded shadow"
                        >
                          <div className="flex justify-between items-center">
                            <label
                              className="block font-semibold mb-1"
                              htmlFor={id}
                            >
                              {title}
                            </label>
                            <button
                              onClick={() => toggleVisibility(id)}
                              className="text-gray-600"
                            >
                              {visible ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                          {visible && (
                            <textarea
                              name={id}
                              value={videoInfo[id]}
                              onChange={handleChange}
                              className="w-full p-2 border border-gray-300 rounded"
                              rows="4"
                            ></textarea>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4 text-center">
            {t("Generated Video Description")}
          </h2>
          <div className="p-4 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap">
            {generateDescription()}
          </div>
          <button
            onClick={handleCopy}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
          >
            {t("Copy to Clipboard")}
          </button>
        </div>
      </div>
      <div className="content pt-6 pb-5">
        <div
          dangerouslySetInnerHTML={{ __html: existingContent }}
          style={{ listStyleType: "none" }}
        ></div>
      </div>
      <div className="p-5 shadow">
        <div className="accordion">
          <h2 className="faq-title">{t("Frequently Asked Questions")}</h2>
          <p className="faq-subtitle">
            {t("Answered All Frequently Asked Questions, Still Confused? Feel Free To Contact Us")}
          </p>
          <div className="faq-grid">
            {faqs?.map((faq, index) => (
              <div key={index} className="faq-item">
                <span id={`accordion-${index}`} className="target-fix"></span>
                <a
                  href={`#accordion-${index}`}
                  id={`open-accordion-${index}`}
                  className="accordion-header"
                  onClick={() => toggleFAQ(index)}
                >
                  {faq.question}
                </a>
                <a
                  href={`#accordion-${index}`}
                  id={`close-accordion-${index}`}
                  className="accordion-header"
                  onClick={() => toggleFAQ(index)}
                >
                  {faq.question}
                </a>
                <div
                  className={`accordion-content ${
                    openIndex === index ? "open" : ""
                  }`}
                >
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <hr className="mt-4 mb-2" />
      <div className="row pt-3">
        <div className="col-md-4">
          <div className=" text-3xl font-bold mb-2">{t("Customer reviews")}</div>
          <div className="flex items-center mb-2">
            <div className="text-3xl font-bold mr-2">{overallRating}</div>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  color={i < Math.round(overallRating) ? "#ffc107" : "#e4e5e9"}
                />
              ))}
            </div>
            <div className="ml-2 text-sm text-gray-500">
              {reviews.length} {t("global ratings")}
            </div>
          </div>
          <div>
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center mb-1">
                <div className="w-12 text-right mr-4">{rating}-star</div>
                <div className="flex-1 h-4 bg-gray-200 rounded-full relative">
                  <div
                    className="h-4 bg-yellow-500 rounded-full absolute top-0 left-0"
                    style={{ width: `${calculateRatingPercentage(rating)}%` }}
                  ></div>
                </div>
                <div className="w-12 text-left ml-4">
                  {calculateRatingPercentage(rating).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
          <hr />
          <div className="pt-3">
            <h4>{t("Review This Tool")}</h4>
            <p>{t("Share Your Thoughts With Other Customers")}</p>
            <button
              className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline mt-4 mb-4"
              onClick={openReviewForm}
            >
              {t("Write a customer review")}
            </button>
          </div>
        </div>
        <div className="col-md-8">
          {reviews.slice(0, 5).map((review, index) => (
            <div key={index} className="border p-6 m-5 bg-white">
              <div className="flex items-center mb-4">
                <Image
                  src={`data:image/jpeg;base64,${review?.userProfile}`}
                  alt={review.name}
                  className="w-12 h-12 rounded-full"
                  width={48}
                  height={48}
                />
                <div className="ml-4">
                  <div className="font-bold">{review?.userName}</div>
                  <div className="text-gray-500 text-sm">{t("Verified Purchase")}</div>
                </div>
              </div>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    size={20}
                    color={i < review.rating ? "#ffc107" : "#e4e5e9"}
                  />
                ))}
                <div>
                  <span className="fw-bold mt-2 ms-2">{review?.title}</span>
                </div>
              </div>
              <div className="text-gray-500 text-sm mb-4">
                {t("Reviewed On")} {review.createdAt}
              </div>
              <div className="text-lg mb-4">{review.comment}</div>
            </div>
          ))}
          {!showAllReviews && reviews.length > 5 && (
            <button
              className="btn btn-primary mt-4 mb-5"
              onClick={handleShowMoreReviews}
            >
              {t("See More Reviews")}
            </button>
          )}
          {showAllReviews &&
            reviews.slice(5).map((review, index) => (
              <div key={index} className="border p-6 m-5 bg-white">
                <div className="flex items-center mb-4">
                  <Image
                    src={`data:image/jpeg;base64,${review?.userProfile}`}
                    alt={review.name}
                    className="w-12 h-12 rounded-full"
                    width={48}
                    height={48}
                  />
                  <div className="ml-4">
                    <div className="font-bold">{review?.userName}</div>
                    <div className="text-gray-500 text-sm">
                      {t("Verified Purchase")}
                    </div>
                    <p className="text-muted">
                      {t("Reviewed On")} {review?.createdAt}
                    </p>
                  </div>
                </div>
                <div className="text-lg font-semibold">{review.title}</div>
                <div className="text-gray-500 mb-4">{review.date}</div>
                <div className="text-lg mb-4">{review.comment}</div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      size={20}
                      color={i < review.rating ? "#ffc107" : "#e4e5e9"}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {modalVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="bg-white p-6 rounded-lg shadow-lg z-50 w-full">
            <h2 className="text-2xl font-semibold mb-4">{t("Leave a Review")}</h2>
            <div className="mb-4">
              <StarRating
                rating={newReview.rating}
                setRating={(rating) => setNewReview({ ...newReview, rating })}
              />
            </div>
            <div className="mb-4">
              <input
                type="text"
                className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                placeholder={t("Title")}
                value={newReview.title}
                onChange={(e) =>
                  setNewReview({ ...newReview, title: e.target.value })
                }
              />
            </div>
            <div className="mb-4">
              <textarea
                className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                placeholder={t("Your Review")}
                value={newReview.comment}
                onChange={(e) =>
                  setNewReview({ ...newReview, comment: e.target.value })
                }
              />
            </div>
            <button
              className="btn btn-primary w-full text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
              onClick={handleReviewSubmit}
            >
              {t("Submit Review")}
            </button>
            <button
              className="btn btn-secondary w-full text-white font-bold py-2 px-4 rounded hover:bg-gray-700 focus:outline-none focus:shadow-outline mt-2"
              onClick={closeModal}
            >
              {t("Cancel")}
            </button>
          </div>
        </div>
      )}
      {/* Related Tools Section */}
      <div className="related-tools mt-10 shadow-lg p-5 rounded-lg bg-white">
        <h2 className="text-2xl font-bold mb-5 text-center">{t("Related Tools")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {relatedTools.map((tool, index) => (
            <Link
              key={index}
              href={tool.link}
              className="flex items-center border rounded-lg p-4 bg-gray-100 transition"
            >
              <Image
                src={tool?.logo?.src}
                alt={`${tool.name} Icon`}
                width={64}
                height={64}
                className="mr-4"
              />
              <span className="text-blue-600 font-medium">{tool.name}</span>
            </Link>
          ))}
        </div>
      </div>
      {/* End of Related Tools Section */}
    </div>
  );
};

export async function getServerSideProps({ req, locale }) {
  const host = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] === 'https' ? 'https' : 'http';
  const apiUrl = `${protocol}://${host}/api/content?category=DescriptionGenerator&language=${locale}`;

  try {
    const contentResponse = await fetch(apiUrl);

    if (!contentResponse.ok) {
      throw new Error('Failed to fetch content');
    }

    const contentData = await contentResponse.json();
    const meta = {
      title: contentData.translations[locale]?.title || '',
      description: contentData.translations[locale]?.description || '',
      image: contentData.translations[locale]?.image || '',
      url: `${protocol}://${host}/tools/description-generator`,
    };

    return {
      props: {
        meta,
        faqs: contentData.translations[locale]?.faqs || [],
        relatedTools: contentData.translations[locale]?.relatedTools || [],
        existingContent: contentData.translations[locale]?.content || '',
        ...(await serverSideTranslations(locale, ['description', 'navbar', 'footer'])),
      },
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      props: {
        meta: {},
        faqs: [],
        relatedTools: [],
        existingContent: '',
        ...(await serverSideTranslations(locale, ['description', 'navbar', 'footer'])),
      },
    };
  }
}

export default YouTubeDescriptionGenerator;
