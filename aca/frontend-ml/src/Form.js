import useForm from "./UseForm";
import { useState } from "react";


const FORM_ENDPOINT = process.env.REACT_APP_API_ENDPOINT
const procFunc = (event) => {
  document.getElementById("processing").innerHTML = "Processing..."
}

const Form = () => {
    // add this to your Form component before return ()
    const [formEndpoint, setFormEndpoint] = useState(FORM_ENDPOINT);

    const handleOnBlur = (event) => {
        if(!event.target.value) {
            alert('Please enter a valid image link! ');
        }   
        setFormEndpoint(`${FORM_ENDPOINT}?image_link=${event.target.value}`);
    }

 
    const { handleSubmit, status, message, } = useForm({

      });

      if (status === "success") {
        return (
          <>
            <div className="text-2xl">Thank you!</div>
            <div className="text-md">{message}</div>
          </>
        );
      }
    
      if (status === "error") {
        return (
          <>
            <div className="text-2xl">Something bad happened!</div>
            <div className="text-md">{message}</div>
          </>
        );
      }

    return (
        <form  
        action={formEndpoint}
        onSubmit={handleSubmit}
        method="POST"
        >
            <div className="pt-0 mb-3">
                <input
                type="text"
                placeholder="Image Link"
                name="image_link"
                onBlur={handleOnBlur}
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


        </form>
    );
};

export default Form;