import { useState } from "react";

const FORM_ENDPOINT = process.env.REACT_APP_API_ENDPOINT;

const procFunc = () => {
  document.getElementById("processing").innerHTML = "Processing...";
};

const Form = () => {
  const [formEndpoint, setFormEndpoint] = useState(FORM_ENDPOINT);
  const [inputValue, setInputValue] = useState('');
  const [apiResponse, setApiResponse] = useState('');
  const [status, setStatus] = useState('');

  const handleOnBlur = (event) => {
    if (!event.target.value) {
      alert('Please enter a valid image link!');
    }
    setFormEndpoint(`${FORM_ENDPOINT}?image_link=${event.target.value}`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the default form submission behavior
    setStatus('loading');
    procFunc();
    try {
      const response = await fetch(formEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_link: inputValue }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      setApiResponse(result.message); // Assuming the API response has a 'message' field
      setStatus('success');
    } catch (error) {
      console.error('Error:', error);
      setApiResponse('Error occurred while fetching data');
      setStatus('error');
    } finally {
      document.getElementById("processing").innerHTML = ""; // Clear the processing message
    }
  };

  return (
    <form onSubmit={handleSubmit} method="POST">
      <div className="pt-0 mb-3">
        <input
          type="text"
          placeholder="Image Link"
          name="image_link"
          onBlur={handleOnBlur}
          onChange={(e) => setInputValue(e.target.value)}
          className="focus:outline-none focus:ring relative w-full px-3 py-3 text-sm text-gray-600 placeholder-gray-400 bg-white border-0 rounded shadow outline-none"
          required
        />
      </div>
      {status !== "loading" && (
        <div className="pt-0 mb-3">
          <button
            onClick={procFunc}
            className="active:bg-blue-600 hover:shadow-lg focus:outline-none px-6 py-3 mb-1 mr-1 text-sm font-bold text-white uppercase transition-all duration-150 ease-linear bg-blue-500 rounded shadow outline-none"
            type="submit"
          >
            Submit an image
          </button>
        </div>
      )}
      <p id="processing"> </p>
      {status === "success" && (
        <div className="pt-0 mb-3">
          <textarea
            value={apiResponse}
            readOnly
            rows="10"
            cols="50"
            className="focus:outline-none focus:ring relative w-full px-3 py-3 text-sm text-gray-600 placeholder-gray-400 bg-white border-0 rounded shadow outline-none"
            placeholder="API response will be displayed here"
          />
        </div>
      )}
      {status === "error" && (
        <div className="pt-0 mb-3">
          <textarea
            value={apiResponse}
            readOnly
            rows="10"
            cols="50"
            className="focus:outline-none focus:ring relative w-full px-3 py-3 text-sm text-gray-600 placeholder-gray-400 bg-white border-0 rounded shadow outline-none"
            placeholder="Error occurred while fetching data"
          />
        </div>
      )}
    </form>
  );
};

export default Form;