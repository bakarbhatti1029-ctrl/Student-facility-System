import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRedo } from 'react-icons/fa';

// Themed copy per HTTP status code this app actually sends (see backend
// controllers). Falls back to a generic "something wobbled" for anything
// else (500, unexpected errors, or a status we don't recognize).
const STATUS_CONTENT = {
  400: {
    title: 'Tom fumbled that one',
    description: 'Something about this request tripped things up. Please check the details and try again.',
  },
  401: {
    title: 'Tom chased your session away!',
    description: "Looks like you've been logged out. Log back in and we'll pick up right where you left off.",
  },
  402: {
    title: 'Jerry ran off with the payment',
    description: "Your payment couldn't go through. Please check your card details and try again.",
  },
  403: {
    title: "Tom says you can't come in",
    description: "You don't have permission to do that.",
  },
  404: {
    title: "Jerry's hiding this page",
    description: "We couldn't find what you were looking for.",
  },
  409: {
    title: 'Already chased, already done!',
    description: 'Looks like this was already done. Refreshing might help.',
  },
  429: {
    title: 'Whoa there, slow down!',
    description: 'Too many chases too fast! Take a breath and try again in a moment.',
  },
  500: {
    title: 'Uh-oh, Jerry knocked something over',
    description: 'Something unexpected happened on our end. Please try again shortly.',
  },
};

const DEFAULT_CONTENT = {
  title: 'Lost the trail',
  description: "We couldn't reach the server. Check your connection and try again.",
};

// Axios's own default error message ("Request failed with status code 401")
// isn't useful to show verbatim - prefer the themed description for it.
const isGenericAxiosMessage = (text) => /^request failed with status code \d+$/i.test(text.trim());

/**
 * Friendly replacement for bare "Error: {message}" text. Picks themed
 * copy based on the real HTTP status code (pass it via `status`, or via
 * `message.status` if message is the raw error/rejection object), and
 * falls back to the backend's own message as the description when it's
 * more specific than the generic default.
 */
const ErrorState = ({ message, status, onRetry }) => {
  const navigate = useNavigate();
  const [imageFailed, setImageFailed] = useState(false);
  const text = typeof message === 'string' ? message : (message?.message || '');
  const resolvedStatus = status || (message && typeof message === 'object' ? message.status : undefined);

  const content = STATUS_CONTENT[resolvedStatus] || DEFAULT_CONTENT;
  const description = (text && !isGenericAxiosMessage(text)) ? text : content.description;
  const isAuthError = resolvedStatus === 401;

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 text-white w-full">
      {!imageFailed && (
        <img
          src={isAuthError ? '/images/tom-and-jerry-1.png' : '/images/tom-and-jerry-2.png'}
          alt=""
          className="w-40 h-auto mb-4 select-none"
          onError={() => setImageFailed(true)}
        />
      )}
      <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
      <p className="text-gray-400 max-w-md mb-6">{description}</p>
      {isAuthError ? (
        <button
          onClick={() => navigate('/loginform')}
          className="bg-[#697565] hover:bg-[#3C3D37] text-white px-6 py-2 rounded-lg font-semibold transition"
        >
          Log In Again
        </button>
      ) : onRetry ? (
        <button
          onClick={onRetry}
          className="bg-[#697565] hover:bg-[#3C3D37] text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2"
        >
          <FaRedo /> Try Again
        </button>
      ) : null}
    </div>
  );
};

export default ErrorState;
