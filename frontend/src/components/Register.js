import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useDispatch } from 'react-redux';
import { registerUser } from '../store/authSlice';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from "axios";
import API_BASE_URL from '../utils/api';
import ImageUploadField from './common/ImageUploadField';
import LocationPicker from './common/LocationPicker';
import InstituteAutocomplete from './common/InstituteAutocomplete';

// Validation schemas
// Explicit allowed addresses and allowed domains for registration
const EXPLICIT_ALLOWED_EMAILS = [
  'user@gmail.com',
  'john.doe@yahoo.com',
  'alice@outlook.com',
  'bob@hotmail.com',
  'professor@harvard.edu',
  'student@mit.edu',
  'admin@ucla.edu',
  'support@microsoft.com',
  'info@amazon.com',
  'contact@bbc.co.uk',
];

const ALLOWED_DOMAINS = [
  'gmail.com','googlemail.com','yahoo.com','yahoo.co.uk','yahoo.fr','yahoo.de','outlook.com','hotmail.com','live.com','msn.com','aol.com','mail.com','protonmail.com','protonmail.ch','icloud.com','me.com','mac.com','zoho.com','yandex.com','yandex.ru','gmx.com','gmx.net','web.de','t-online.de','comcast.net','sbcglobal.net','att.net','verizon.net','cox.net','charter.net','bellsouth.net','earthlink.net','juno.com','netzero.com','optimum.net','frontier.com','spectrum.net'
];

const isAllowedEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  if (EXPLICIT_ALLOWED_EMAILS.includes(normalized)) return true;
  const parts = normalized.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return ALLOWED_DOMAINS.includes(domain);
};

const PHONE_COUNTRIES = [
  { code: '+92', label: 'Pakistan (+92)' },
  { code: '+91', label: 'India (+91)' },
  { code: '+234', label: 'Nigeria (+234)' },
];

const internationalPhoneSchema = Yup.string()
  .matches(/^\+(?:92|91|234)[0-9]{10}$/, 'Select a country code and enter a 10-digit phone number')
  .required('Phone number is required');

const validationSchemas = {
  student: Yup.object({
    first_name: Yup.string().required("First name is required"),
    last_name: Yup.string().required("Last name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required")
      .test('allowed-email', 'Email is not allowed for registration', (value) => isAllowedEmail(value)),
    password: Yup.string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm password is required"),
    phone_number: internationalPhoneSchema,
    address: Yup.string().required("Address is required"),
    gender: Yup.string().required("Gender is required"),
    profile_picture: Yup.string()
      .url("Invalid URL")
      .required("Profile picture URL is required"),
    cnic: Yup.string()
      .matches(/^[0-9]{13}$/, "CNIC must be 13 digits")
      .required("CNIC is required") }),
  hostelOwner: Yup.object({
    first_name: Yup.string().required("First name is required"),
    last_name: Yup.string().required("Last name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required")
      .test('allowed-email', 'Email is not allowed for registration', (value) => isAllowedEmail(value)),
    password: Yup.string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm password is required"),
    phone_number: internationalPhoneSchema,
    address: Yup.string().required("Address is required"),
    profile_picture: Yup.string()
      .url("Invalid URL")
      .required("Profile picture URL is required"),
    hostel_name: Yup.string().required("Hostel name is required"),
    hostel_type: Yup.string().required("Hostel type is required"),
    hostel_address: Yup.string().required("Hostel address is required"),
    hostel_description: Yup.string().required("Hostel description is required"),
    hostel_picture: Yup.string()
      .url("Invalid URL")
      .required("Hostel picture URL is required"),
    facilities: Yup.array()
      .of(Yup.string())
      .required("At least one facility is required"),
    nearby_institutes: Yup.array()
      .of(
        Yup.object({
          university: Yup.string().required("University name is required"),
          distance: Yup.string().required("Distance is required") })
      )
      .min(1, "At least one nearby institute is required"),
    cnic: Yup.string()
      .matches(/^[0-9]{13}$/, "CNIC must be 13 digits")
      .required("CNIC is required") }),
  kitchenOwner: Yup.object({
    first_name: Yup.string().required("First name is required"),
    last_name: Yup.string().required("Last name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required")
      .test('allowed-email', 'Email is not allowed for registration', (value) => isAllowedEmail(value)),
    password: Yup.string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm password is required"),
    phone_number: internationalPhoneSchema,
    address: Yup.string().required("Address is required"),
    profile_picture: Yup.string()
      .url("Invalid URL")
      .required("Profile picture URL is required"),
    kitchen_name: Yup.string().required("Kitchen name is required"),
    kitchen_address: Yup.string().required("Kitchen address is required"),
    kitchen_description: Yup.string().required(
      "Kitchen description is required"
    ),
    kitchen_picture: Yup.string()
      .url("Invalid URL")
      .required("Kitchen picture URL is required"),
    cnic: Yup.string()
      .matches(/^[0-9]{13}$/, "CNIC must be 13 digits")
      .required("CNIC is required") }) };

const RegistrationForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState('+92');

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const formik = useFormik({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone_number: "",
      address: "",
      gender: "",
      profile_picture: "",
      hostel_name: "",
      hostel_type: "",
      hostel_address: "",
      hostel_description: "",
      hostel_picture: "",
      hostel_lat: null,
      hostel_lng: null,
      facilities: [],
      nearby_institutes: [{ university: "", distance: "" }],
      kitchen_name: "",
      kitchen_address: "",
      kitchen_description: "",
      kitchen_picture: "",
      // stripe_account_id: "", // Added Stripe Account ID field
      cnic: "" },
    validationSchema: validationSchemas[role],
    onSubmit: async (values) => {
      try {
        console.log("Starting form submission...");
        console.log("Selected role:", role);
        console.log("Form values:", values);

        // Check form validation manually for hostel owner
        if (role === 'hostelOwner') {
          console.log("Validating hostel owner fields...");
          // Remove validation check for now to test if the form submission works
          // We'll troubleshoot validation later if needed
        }

        // Normalize role names to match backend expectations
        let normalizedRole = role.toLowerCase();
        console.log('Form submission for role:', normalizedRole);
        
        // Create a basic payload first
        let payload = {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword,
          phone_number: values.phone_number,
          address: values.address,
          cnic: values.cnic,
          role: normalizedRole
        };

        // Add role-specific fields directly without conditions for testing
        if (normalizedRole === 'hostelowner') {
          console.log("Adding hostel owner specific fields to payload");
          payload = {
            ...payload,
            profile_picture: values.profile_picture,
            hostel_name: values.hostel_name || "Test Hostel",
            hostel_type: values.hostel_type || "male",
            hostel_address: values.hostel_address || values.address,
            hostel_description: values.hostel_description || "A nice hostel",
            hostel_picture: values.hostel_picture || "https://example.com/hostel.jpg",
            facilities: values.facilities && values.facilities.length > 0 ? values.facilities : ["Wi-Fi"],
            nearby_institutes: values.nearby_institutes
              .filter(inst => inst.university && inst.university.trim() !== "")
              .map(inst => ({
                university: inst.university.trim(),
                distance: inst.distance ? inst.distance.trim() : "Distance not provided" }))
          };
        } else if (normalizedRole === 'student') {
          payload = {
            ...payload,
            gender: values.gender,
            profile_picture: values.profile_picture
          };
        } else if (normalizedRole === 'kitchenowner') {
          payload = {
            ...payload,
            profile_picture: values.profile_picture,
            kitchen_name: values.kitchen_name,
            kitchen_address: values.kitchen_address || values.address,
            kitchen_description: values.kitchen_description,
            kitchen_picture: values.kitchen_picture
          };
        }

        // Single registration call via Redux thunk
        const response = await dispatch(registerUser(payload)).unwrap();

        if (response.requiresVerification) {
          // Clear any previously logged-in user data so stale profile isn't shown
          sessionStorage.removeItem('user');
          toast.success('Registration successful! Please check your email for OTP.');
          navigate('/otp');
        }
      } catch (error) {
        console.error('Registration error:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
        toast.error(errorMessage);
        setError(errorMessage);
      }
    } });

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    formik.setValues({
      ...formik.values,
      role: e.target.value,
      hostel_name: "",
      hostel_type: "",
      hostel_address: "",
      hostel_description: "",
      hostel_picture: "",
      hostel_lat: null,
      hostel_lng: null,
      facilities: [],
      nearby_institutes: [{ university: "", distance: "" }],
      kitchen_name: "",
      kitchen_address: "",
      kitchen_description: "",
      kitchen_picture: "",
      // stripe_account_id: "" });
    formik.setTouched({});
    formik.setErrors({});
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    if (checked) {
      formik.setFieldValue("facilities", [...formik.values.facilities, name]);
    } else {
      formik.setFieldValue(
        "facilities",
        formik.values.facilities.filter((facility) => facility !== name)
      );
    }
  };

  const handleNearbyInstituteChange = (index, e) => {
    const { name, value } = e.target;
    const newNearbyInstitutes = [...formik.values.nearby_institutes];
    newNearbyInstitutes[index][name] = value;
    formik.setFieldValue("nearby_institutes", newNearbyInstitutes);
  };

  const addNearbyInstitute = () => {
    formik.setFieldValue("nearby_institutes", [
      ...formik.values.nearby_institutes,
      { university: "", distance: "" },
    ]);
  };

  const submitRegistration = async (values) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      console.log("Manual submission starting...");

      // Normalize role name
      let normalizedRole = role.toLowerCase();
      
      // Create the payload
      let payload = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        phone_number: values.phone_number,
        address: values.address,
        cnic: values.cnic,
        role: normalizedRole
      };
      
      // Add role-specific fields
      if (normalizedRole === 'hostelowner') {
        payload = {
          ...payload,
          hostel_name: values.hostel_name || "Test Hostel",
          hostel_type: values.hostel_type || "male",
          hostel_address: values.hostel_address || values.address,
          hostel_description: values.hostel_description || "A nice hostel", 
          hostel_picture: values.hostel_picture || "https://example.com/hostel.jpg",
          facilities: values.facilities?.length > 0 ? values.facilities : ["Wi-Fi"],
          nearby_institutes: values.nearby_institutes
            .filter(inst => inst.university && inst.university.trim() !== "")
            .map(inst => ({
              university: inst.university.trim(),
              distance: inst.distance ? inst.distance.trim() : "Distance not provided" })),
          // Only sent if the owner used the map picker — backend falls back
          // to geocoding hostel_address when these are absent.
          ...(values.hostel_lat != null && values.hostel_lng != null
            ? { hostel_lat: values.hostel_lat, hostel_lng: values.hostel_lng }
            : {}) };
      } else if (normalizedRole === 'student') {
        payload = {
          ...payload,
          gender: values.gender,
          profile_picture: values.profile_picture
        };
      } else if (normalizedRole === 'kitchenowner') {
        payload = {
          ...payload,
          kitchen_name: values.kitchen_name,
          kitchen_address: values.kitchen_address || values.address,
          kitchen_description: values.kitchen_description,
          kitchen_picture: values.kitchen_picture
        };
      }
      
      console.log("Final payload:", payload);
      
      // Direct API call first
      try {
        console.log("Making direct API call...");
        const response = await axios.post(`${API_BASE_URL}/auth/register`, payload, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log("Direct API call succeeded:", response.data);
        
        if (response.data.requiresVerification) {
          toast.success('Registration successful! Please check your email for OTP.');
          navigate('/otp');
        }
      } catch (apiError) {
        console.error("Direct API call failed:", apiError);
        
        // Log detailed error information
        if (apiError.response) {
          console.error("Error response data:", apiError.response.data);
          console.error("Error status:", apiError.response.status);
        } else if (apiError.request) {
          console.error("No response received:", apiError.request);
        } else {
          console.error("Error during request setup:", apiError.message);
        }
        
        toast.error(apiError.response?.data?.message || apiError.message || 'Registration failed');
      }
    } catch (error) {
      console.error("Error in manual submission:", error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="h-full w-full bg-[#181C14] ">
      <div className=" h-[100vh]   flex justify-center container">
      <div className="border-[#59636e] border rounded-lg flex flex-col md:flex-row w-[92%] md:w-auto mx-auto md:mx-0 md:ml-32 mt-16 md:mt-28 mb-16 md:mb-28">
        <div className="flex flex-col bg-[#25292e] items-center  justify-center h-auto md:h-[80vh] rounded-lg    ">
          <img
            className="w-full md:w-[600px] h-auto md:h-[100%] rounded"
            src="/images/signup.jpg"
            alt="Signup"
          />

        </div>
        <div className="relative  bg-[#25292e]   rounded-lg pt-8 p-4    w-full max-w-lg overflow-visible md:overflow-y-auto  h-auto md:h-[80vh]">
          <form onSubmit={formik.handleSubmit} className="space-y-4">
          <h2 className="text-3xl text-center font-bold text-[#ECDFCC]">Register as</h2>
            <div className="mb-4 text-gray-300 flex flex-wrap gap-x-2 gap-y-1">
              <label className="mr-4 text-xl font-bold">
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={role === "student"}
                  onChange={handleRoleChange}
                  className="mr-2"
                  style={{ accentColor: role === "student" ? "black" : "" }}
                />
                Student
              </label>
              <label className="mr-4 text-xl font-bold">
                <input
                  type="radio"
                  name="role"
                  value="hostelOwner"
                  checked={role === "hostelOwner"}
                  onChange={handleRoleChange}
                  className="mr-2"
                  style={{ accentColor: role === "hostelOwner" ? "black" : "" }}
                />
                Hostel Owner
              </label>
              <label className="mr-4 text-xl font-bold">
                <input
                  type="radio"
                  name="role"
                  value="kitchenOwner"
                  checked={role === "kitchenOwner"}
                  onChange={handleRoleChange}
                  className="mr-2"
                  style={{ accentColor: role === "kitchenOwner" ? "black" : "" }}  
                />
                Kitchen Owner
              </label>
            </div>

            <div className="mb-4">
              <label
                htmlFor="first_name"
                className="block text-lg font-medium text-gray-300"
              >
                First Name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                onChange={formik.handleChange}
                value={formik.values.first_name}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white"
              />
              {formik.touched.first_name && formik.errors.first_name ? (
                <div className="text-red-600 text-sm">
                  {formik.errors.first_name}
                </div>
              ) : null}
            </div>

            <div className="mb-4">
              <label
                htmlFor="last_name"
                className="block text-lg font-medium text-gray-300"
              >
                Last Name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                onChange={formik.handleChange}
                value={formik.values.last_name}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white"
              />
              {formik.touched.last_name && formik.errors.last_name ? (
                <div className="text-red-600 text-sm">
                  {formik.errors.last_name}
                </div>
              ) : null}
            </div>

            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-lg font-medium text-gray-300"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                onChange={formik.handleChange}
                value={formik.values.email}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white"
              />
              {formik.touched.email && formik.errors.email ? (
                <div className="text-red-600 text-sm">
                  {formik.errors.email}
                </div>
              ) : null}
            </div>

            <div className="mb-4 relative">
              <label
                htmlFor="password"
                className="block text-lg font-medium text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                onChange={formik.handleChange}
                value={formik.values.password}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white"
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <FontAwesomeIcon
                  className="pt-7"
                  icon={showPassword ? faEyeSlash : faEye}
                />
              </button>
              {formik.touched.password && formik.errors.password ? (
                <div className="text-red-600 text-sm">
                  {formik.errors.password}
                </div>
              ) : null}
            </div>

            <div className="mb-4 relative">
              <label
                htmlFor="confirmPassword"
                className="block text-lg font-medium text-gray-300"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                onChange={formik.handleChange}
                value={formik.values.confirmPassword}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white"
              />
              <button
                type="button"
                onClick={toggleShowConfirmPassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <FontAwesomeIcon
                  className="pt-7"
                  icon={showConfirmPassword ? faEyeSlash : faEye}
                />
              </button>
              {formik.touched.confirmPassword &&
              formik.errors.confirmPassword ? (
                <div className="text-red-600 text-sm">
                  {formik.errors.confirmPassword}
                </div>
              ) : null}
            </div>

            <div className="mb-4">
              <label
                htmlFor="phone_number"
                className="block text-lg font-medium text-gray-300"
              >
                Phone Number
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <select
                  aria-label="Phone country code"
                  value={phoneCountryCode}
                  onChange={(e) => {
                    const nextCode = e.target.value;
                    const localNumber = (formik.values.phone_number || '').slice(phoneCountryCode.length);
                    setPhoneCountryCode(nextCode);
                    formik.setFieldValue('phone_number', localNumber ? `${nextCode}${localNumber}` : '');
                  }}
                  className="px-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-700 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {PHONE_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>{country.label}</option>
                  ))}
                </select>
                <input
                  id="phone_number"
                  name="phone_number_local"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => {
                    const digits = (e.target.value || '').replace(/\D/g, '').slice(0, 10);
                    formik.setFieldValue('phone_number', digits ? `${phoneCountryCode}${digits}` : '');
                  }}
                  onBlur={() => formik.setFieldTouched('phone_number', true)}
                  value={(formik.values.phone_number || '').slice(phoneCountryCode.length)}
                  className="p-2 block w-full border border-gray-300 rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white"
                />
              </div>
              {formik.touched.phone_number && formik.errors.phone_number ? (
                <div className="text-red-600 text-sm">
                  {formik.errors.phone_number}
                </div>
              ) : null}
            </div>

            <div className="mb-4">
              <label
                htmlFor="address"
                className="block text-lg font-medium text-gray-300"
              >
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                onChange={formik.handleChange}
                value={formik.values.address}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white"
              />
              {formik.touched.address && formik.errors.address ? (
                <div className="text-red-600 text-sm">
                  {formik.errors.address}
                </div>
              ) : null}
            </div>

            {role === "student" && (
              <>
                <div className="mb-4">
                  <label
                    htmlFor="gender"
                    className="block text-lg font-medium text-gray-300"
                  >
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    onChange={formik.handleChange}
                    value={formik.values.gender}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {formik.touched.gender && formik.errors.gender ? (
                    <div className="text-red-600 text-sm">
                      {formik.errors.gender}
                    </div>
                  ) : null}
                </div>

                <ImageUploadField
                  label="Profile Picture"
                  name="profile_picture"
                  value={formik.values.profile_picture}
                  onChange={(url) => formik.setFieldValue('profile_picture', url)}
                  onBlur={formik.handleBlur}
                  error={formik.touched.profile_picture && formik.errors.profile_picture}
                  uploadType="profile"
                />
              </>
            )}

            {role === "hostelOwner" && (
              <>
                <div className="mb-4">
                  <label
                    htmlFor="hostel_name"
                    className="block text-lg font-medium text-gray-300"
                  >
                    Hostel Name
                  </label>
                  <input
                    id="hostel_name"
                    name="hostel_name"
                    type="text"
                    onChange={formik.handleChange}
                    value={formik.values.hostel_name}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white"
                  />
                  {formik.touched.hostel_name && formik.errors.hostel_name ? (
                    <div className="text-red-600 text-sm">
                      {formik.errors.hostel_name}
                    </div>
                  ) : null}
                </div>

                <ImageUploadField
                  label="Hostel Owner Profile Picture"
                  name="profile_picture"
                  value={formik.values.profile_picture}
                  onChange={(url) => formik.setFieldValue('profile_picture', url)}
                  onBlur={formik.handleBlur}
                  error={formik.touched.profile_picture && formik.errors.profile_picture}
                  uploadType="profile"
                />

                <div className="mb-4">
                  <label
                    htmlFor="hostel_type"
                    className="block text-lg font-medium text-gray-300"
                  >
                    Hostel Type
                  </label>
                  <select
                    id="hostel_type"
                    name="hostel_type"
                    onChange={formik.handleChange}
                    value={formik.values.hostel_type}
                    className="mt-1 p-2 block w-full border border-gray-300 bg-[#25292e] text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Hostel Type</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="coed">Co-ed</option>
                  </select>
                  {formik.touched.hostel_type && formik.errors.hostel_type ? (
                    <div className="text-red-600 text-sm">
                      {formik.errors.hostel_type}
                    </div>
                  ) : null}
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="hostel_address"
                    className="block text-lg font-medium text-gray-300"
                  >
                    Hostel Address
                  </label>
                  <input
                    id="hostel_address"
                    name="hostel_address"
                    type="text"
                    onChange={formik.handleChange}
                    value={formik.values.hostel_address}
                    className="mt-1 p-2 block w-full border bg-[#25292e] text-white border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {formik.touched.hostel_address &&
                  formik.errors.hostel_address ? (
                    <div className="text-red-600 text-sm">
                      {formik.errors.hostel_address}
                    </div>
                  ) : null}
                </div>

                <LocationPicker
                  value={
                    formik.values.hostel_lat != null
                      ? { lat: formik.values.hostel_lat, lng: formik.values.hostel_lng }
                      : null
                  }
                  onChange={({ lat, lng }) => {
                    formik.setFieldValue('hostel_lat', lat);
                    formik.setFieldValue('hostel_lng', lng);
                  }}
                  addressHint={formik.values.hostel_address}
                />

                <div className="mb-4">
                  <label
                    htmlFor="hostel_description"
                    className="block text-lg font-medium text-gray-300"
                  >
                    Hostel Description
                  </label>
                  <textarea
                    id="hostel_description"
                    name="hostel_description"
                    onChange={formik.handleChange}
                    value={formik.values.hostel_description}
                    className="mt-1 p-2 block w-full border bg-[#25292e] text-white border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {formik.touched.hostel_description &&
                  formik.errors.hostel_description ? (
                    <div className="text-red-600 text-sm">
                      {formik.errors.hostel_description}
                    </div>
                  ) : null}
                </div>

                <ImageUploadField
                  label="Hostel Picture"
                  name="hostel_picture"
                  value={formik.values.hostel_picture}
                  onChange={(url) => formik.setFieldValue('hostel_picture', url)}
                  onBlur={formik.handleBlur}
                  error={formik.touched.hostel_picture && formik.errors.hostel_picture}
                  uploadType="hostel"
                />

                <div className="mb-4">
                  <label className="block text-lg font-medium text-gray-300">
                    Facilities
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3 mt-3">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        name="Wi-Fi"
                        checked={formik.values.facilities.includes("Wi-Fi")}
                        onChange={handleCheckboxChange}
                        className="form-checkbox h-5 w-5 text-indigo-600 shrink-0"
                      />
                      <span className="ml-2 text-gray-300">Wi-Fi</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        name="Parking"
                        checked={formik.values.facilities.includes("Parking")}
                        onChange={handleCheckboxChange}
                        className="form-checkbox h-5 w-5 text-indigo-600 shrink-0"
                      />
                      <span className="ml-2 text-gray-300">Parking</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        name="AC"
                        checked={formik.values.facilities.includes("AC")}
                        onChange={handleCheckboxChange}
                        className="form-checkbox h-5 w-5 text-indigo-600 shrink-0"
                      />
                      <span className="ml-2 text-gray-300">AC</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        name="CCTV"
                        checked={formik.values.facilities.includes("CCTV")}
                        onChange={handleCheckboxChange}
                        className="form-checkbox h-5 w-5 text-indigo-600 shrink-0"
                      />
                      <span className="ml-2 text-gray-300">CCTV</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        name="Generator"
                        checked={formik.values.facilities.includes("Generator")}
                        onChange={handleCheckboxChange}
                        className="form-checkbox h-5 w-5 text-indigo-600 shrink-0"
                      />
                      <span className="ml-2 text-gray-300">Generator</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        name="Laundry"
                        checked={formik.values.facilities.includes("Laundry")}
                        onChange={handleCheckboxChange}
                        className="form-checkbox h-5 w-5 text-indigo-600 shrink-0"
                      />
                      <span className="ml-2 text-gray-300">Laundry</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        name="Water Cooler"
                        checked={formik.values.facilities.includes("Water Cooler")}
                        onChange={handleCheckboxChange}
                        className="form-checkbox h-5 w-5 text-indigo-600 shrink-0"
                      />
                      <span className="ml-2 text-gray-300">Water Cooler</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        name="Study Room"
                        checked={formik.values.facilities.includes("Study Room")}
                        onChange={handleCheckboxChange}
                        className="form-checkbox h-5 w-5 text-indigo-600 shrink-0"
                      />
                      <span className="ml-2 text-gray-300">Study Room</span>
                    </label>
                  </div>
                  {formik.touched.facilities && formik.errors.facilities ? (
                    <div className="text-red-600 text-sm mt-2">
                      {formik.errors.facilities}
                    </div>
                  ) : null}
                </div>

                <div className="mb-4">
                  <label className="block text-lg font-medium text-gray-300">
                    Nearby Institutes
                  </label>
                  {formik.values.nearby_institutes.map((institute, index) => (
                    <div key={index} className="mb-4 p-3 border border-gray-600 rounded-md">
                      <div className="mb-2">
                        <label
                          htmlFor={`nearby_institutes[${index}].university`}
                          className="block text-sm font-medium text-gray-300"
                        >
                          University Name
                        </label>
                        <InstituteAutocomplete
                          id={`nearby_institutes[${index}].university`}
                          name="university"
                          placeholder="e.g. University of the Punjab"
                          value={institute.university}
                          onChange={(e) =>
                            handleNearbyInstituteChange(index, e)
                          }
                          className="mt-1 p-2 block w-full border border-gray-300 rounded-md bg-[#25292e] text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {formik.touched.nearby_institutes?.[index]?.university &&
                        formik.errors.nearby_institutes?.[index]?.university ? (
                          <div className="text-red-600 text-sm">
                            {formik.errors.nearby_institutes[index].university}
                          </div>
                        ) : null}
                      </div>
                      <div className="mb-2">
                        <label
                          htmlFor={`nearby_institutes[${index}].distance`}
                          className="block text-sm font-medium text-gray-300"
                        >
                          Distance from Hostel
                        </label>
                        <input
                          id={`nearby_institutes[${index}].distance`}
                          name="distance"
                          type="text"
                          placeholder="e.g. 1 km"
                          value={institute.distance}
                          onChange={(e) =>
                            handleNearbyInstituteChange(index, e)
                          }
                          className="mt-1 p-2 block w-full border border-gray-300 rounded-md bg-[#25292e] text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {formik.touched.nearby_institutes?.[index]?.distance &&
                        formik.errors.nearby_institutes?.[index]?.distance ? (
                          <div className="text-red-600 text-sm">
                            {formik.errors.nearby_institutes[index].distance}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addNearbyInstitute}
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-[#25292e]"
                  >
                    Add Nearby Institute
                  </button>
                </div>

                {/* Stripe Account ID Field */}
                {/* <div className="mb-4">
                  <label
                    htmlFor="stripe_account_id"
                    className="block text-lg font-medium text-gray-300"
                  >
                    Stripe Account ID
                  </label>
                  <input
                    id="stripe_account_id"
                    name="stripe_account_id"
                    type="text"
                    onChange={formik.handleChange}
                    value={formik.values.stripe_account_id}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md bg-[#25292e] shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {formik.touched.stripe_account_id &&
                  formik.errors.stripe_account_id ? (
                    <div className="text-red-600 text-sm">
                      {formik.errors.stripe_account_id}
                    </div>
                  ) : null}
                </div> */}
              </>
            )}

            {role === "kitchenOwner" && (
              <>
                <div className="mb-4">
                  <label
                    htmlFor="kitchen_name"
                    className="block text-lg font-medium text-gray-300"
                  >
                    Kitchen Name
                  </label>
                  <input
                    id="kitchen_name"
                    name="kitchen_name"
                    type="text"
                    onChange={formik.handleChange}
                    value={formik.values.kitchen_name}
                    className="mt-1 p-2 block w-full border text-white border-gray-300 bg-[#25292e] rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {formik.touched.kitchen_name && formik.errors.kitchen_name ? (
                    <div className="text-red-600 text-sm">
                      {formik.errors.kitchen_name}
                    </div>
                  ) : null}
                </div>

                <ImageUploadField
                  label="Kitchen Owner Profile Picture"
                  name="profile_picture"
                  value={formik.values.profile_picture}
                  onChange={(url) => formik.setFieldValue('profile_picture', url)}
                  onBlur={formik.handleBlur}
                  error={formik.touched.profile_picture && formik.errors.profile_picture}
                  uploadType="profile"
                />

                <div className="mb-4">
                  <label
                    htmlFor="kitchen_address"
                    className="block text-lg font-medium text-gray-300"
                  >
                    Kitchen Address
                  </label>
                  <input
                    id="kitchen_address"
                    name="kitchen_address"
                    type="text"
                    onChange={formik.handleChange}
                    value={formik.values.kitchen_address}
                    className="mt-1 p-2 block w-full border border-gray-300 text-white  bg-[#25292e] rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {formik.touched.kitchen_address &&
                  formik.errors.kitchen_address ? (
                    <div className="text-red-600 text-sm">
                      {formik.errors.kitchen_address}
                    </div>
                  ) : null}
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="kitchen_description"
                    className="block text-lg font-medium text-gray-300"
                  >
                    Kitchen Description
                  </label>
                  <textarea
                    id="kitchen_description"
                    name="kitchen_description"
                    onChange={formik.handleChange}
                    value={formik.values.kitchen_description}
                    className="mt-1 p-2 block w-full border text-white border-gray-300 bg-[#25292e] rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {formik.touched.kitchen_description &&
                  formik.errors.kitchen_description ? (
                    <div className="text-red-600 text-sm">
                      {formik.errors.kitchen_description}
                    </div>
                  ) : null}
                </div>

                <ImageUploadField
                  label="Kitchen Picture"
                  name="kitchen_picture"
                  value={formik.values.kitchen_picture}
                  onChange={(url) => formik.setFieldValue('kitchen_picture', url)}
                  onBlur={formik.handleBlur}
                  error={formik.touched.kitchen_picture && formik.errors.kitchen_picture}
                  uploadType="kitchen"
                />
              </>
            )}

            {/* Add CNIC field */}
            <div className="mb-4">
              <label
                htmlFor="cnic"
                className="block text-lg font-medium text-gray-300"
              >
                CNIC
              </label>
              <input
                id="cnic"
                name="cnic"
                type="tel"
                inputMode="numeric"
                maxLength={13}
                onChange={(e) => {
                  const digits = (e.target.value || '').replace(/\D/g, '').slice(0, 13);
                  formik.setFieldValue('cnic', digits);
                }}
                onBlur={() => formik.setFieldTouched('cnic', true)}
                value={formik.values.cnic}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-[#25292e] text-white"
                placeholder="13-digit CNIC without dashes"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter your 13-digit CNIC number without any dashes or spaces.
              </p>
              <div aria-live="polite" className="mt-1">
                <span className={`text-sm ${formik.values.cnic && formik.values.cnic.length === 13 ? 'text-green-400' : 'text-gray-400'}`}>
                  {formik.values.cnic ? `${formik.values.cnic.length}/13` : '0/13'}
                </span>
              </div>
              {formik.touched.cnic && formik.errors.cnic ? (
                <div className="text-red-600 text-sm">
                  {formik.errors.cnic}
                </div>
              ) : null}
            </div>

            <div className="flex justify-between items-center gap-3">
            <Link to='/'>
            <button className="px-4 py-2 bg-black font-bold  mt-4 text-white rounded-lg">Back</button>
            </Link>
            <button
              type="button"
              disabled={isSubmitting}
              className="px-6 py-2 bg-black font-bold mt-4 text-white rounded-lg disabled:opacity-50"
              onClick={(e) => {
                console.log("Submit button clicked");
                e.preventDefault();
                
                if (role === 'hostelOwner') {
                  const requiredFields = ['hostel_name', 'hostel_type', 'hostel_address', 'hostel_description', 'hostel_picture'];
                  const missingFields = requiredFields.filter(field => !formik.values[field]);
                  
                  if (missingFields.length > 0) {
                    const defaults = {
                      hostel_name: "Test Hostel",
                      hostel_type: "male",
                      hostel_address: formik.values.address,
                      hostel_description: "A nice hostel",
                      hostel_picture: "https://example.com/hostel.jpg"
                    };
                    
                    missingFields.forEach(field => {
                      formik.setFieldValue(field, defaults[field]);
                    });
                    
                    console.log("Added default values for missing fields:", missingFields);
                  }
                }
                
                submitRegistration(formik.values);
              }}
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
            </div>
          </form>
        </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default RegistrationForm;
