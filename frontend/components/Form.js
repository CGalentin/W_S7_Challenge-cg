import React, { useEffect, useState } from 'react' // import React and two hooks: useEffect (runs code on changes) and useState (holds changing data)
import axios from 'axios'                         // import axios to send HTTP requests
import * as yup from 'yup'                        // import Yup for input validation

// 👇 Here are the validation errors, used with Yup.
const validationErrors = {                       
  fullNameTooShort: 'full name must be at least 3 characters', // message when name is under 3 chars
  fullNameTooLong: 'full name must be at most 20 characters',  // message when name is over 20 chars
  sizeIncorrect: 'size must be S or M or L'                    // message when size isn't S, M, or L
}

 // 👇 Here is the schema.
const schema = yup.object().shape({              // define a validation schema object
  fullName: yup                                 // rules for fullName
    .string()                                   // • must be text
    .trim()                                     // • remove extra spaces around
    .min(3, validationErrors.fullNameTooShort)  // • at least 3 chars
    .max(20, validationErrors.fullNameTooLong)  // • at most 20 chars
    .required(),                                // • cannot be empty

  size: yup                                     // rules for size
    .string()                                   // • must be text
    .matches(/^[SML]$/, validationErrors.sizeIncorrect) // • must match S or M or L
    .required(),                                // • cannot be empty

  toppings: yup                                 // rules for toppings
    .array()                                    // • must be an array (list)
    .of(yup.string())                           // • each item must be a string
    .required('Toppings are required'),         // • must have at least an empty array
})

 // 👇 This array helped to construct checkboxes using .map in the JSX.
const toppings = [                              
  { topping_id: '1', text: 'Pepperoni' },      // id + display text for each topping
  { topping_id: '2', text: 'Green Peppers' },
  { topping_id: '3', text: 'Pineapple' },
  { topping_id: '4', text: 'Mushrooms' },
  { topping_id: '5', text: 'Ham' },
]

const initialValues = {                         // default form values
  fullName: '',                                // • start with empty name
  size: '',                                    // • no size selected
  toppings: []                                 // • no toppings selected
}

export default function Form() {                // main Form component
  const [formValues, setFormValues] = useState(initialValues) // state for current form inputs
  const [errors, setErrors] = useState({ fullName: '', size: '' }) // state for validation errors
  const [enabled, setEnabled] = useState(false)   // state for whether submit is enabled
  const [success, setSuccess] = useState()        // state for server success message
  const [failure, setFailure] = useState()        // state for server failure message

  useEffect(() => {                              // run when formValues change
    schema.isValid(formValues)                  // check if whole form is valid
      .then((valid) => setEnabled(valid))       // enable submit if valid
  }, [formValues])                              // dependency: formValues

  const handleChange = (event) => {             // called on any input change
    const { name, value, type, checked } = event.target // get input details
    const newValue =                             // decide new value based on type
      type === 'checkbox'                       // if checkbox...
        ? (checked                              //  if checked
            ? [...formValues[name], value]      //   add value to array
            : formValues[name].filter((item) => item !== value) // remove if unchecked
          )
        : value                                // if not checkbox, just use text/select value

    setFormValues({ ...formValues, [name]: newValue }) // update formValues state

    schema                                     // validate this one field
      .validateAt(name, { [name]: newValue })  // check only the changed field
      .then(() => setErrors({ ...errors, [name]: '' })) // clear error if valid
      .catch((err) => setErrors({ ...errors, [name]: err.errors[0] })) // set error message
  }

  const handleSubmit = (event) => {             // called when form is submitted
    event.preventDefault()                      // stop page reload
    if (!enabled) return                        // do nothing if form is invalid

    axios.post('http://localhost:9009/api/order', formValues) // send formValues to server
      .then(res => {                            // on success...
        setFormValues(initialValues)            // reset form to initialValues
        setSuccess(res.data.message)            // show success message
        setFailure()                            // clear failure
      })
      .catch(err => {                           // on error...
        setFailure(err.response.data.message)   // show failure message
        setSuccess()                            // clear success
      })
  }

  return (
    <form onSubmit={handleSubmit}>              {/* form element with onSubmit handler */}
      <h2>Order Your Pizza</h2>                {/* form title */}
      {success && <div className='success'>{success}</div>} {/* show success if set */}
      {failure && <div className='failure'>{failure}</div>} {/* show failure if set */}

      <div className="input-group">            {/* group for Full Name */}
        <div>
          <label htmlFor="fullName">Full Name</label><br /> {/* label */}
          <input                                  
            placeholder="Type full name"         // placeholder text
            id="fullName"                        // id for linking to label
            type="text"                          // text input
            name="fullName"                      // name matches schema key
            value={formValues.fullName}          // controlled value from state
            onChange={handleChange}              // call handler on change
          />
        </div>
        {errors.fullName && <div className='error'>{errors.fullName}</div>} {/* show name error */}
      </div>

      <div className="input-group">            {/* group for Size selector */}
        <div>
          <label htmlFor="size">Size</label><br />
          <select                              
            id="size"                            // id for label
            name="size"                          // name matches schema key
            value={formValues.size}              // controlled value from state
            onChange={handleChange}              // call handler on change
          >
            <option value="">----Choose Size----</option> {/* default empty option */}
            {/* Fill out the missing options */}
            <option value="S">Small</option>     {/* option Small */}
            <option value="M">Medium</option>    {/* option Medium */}
            <option value="L">Large</option>     {/* option Large */}
          </select>
        </div>
        {errors.size && <div className='error'>{errors.size}</div>} {/* show size error */}
      </div>

      <div className="input-group">            {/* group for Toppings checkboxes */}
        {/* 👇 Generated the checkboxes dynamically */}
        {toppings.map((topping) => (            // loop through toppings array
          <label key={topping.topping_id}>    
            <input
              type="checkbox"                   // checkbox input
              name="toppings"                   // name matches schema key
              value={topping.topping_id}        // value is the topping id
              checked={formValues.toppings.includes(topping.topping_id)} // controlled checked
              onChange={handleChange}           // call handler on change
            />
            {topping.text}                  
            <br />
          </label>
        ))}
      </div>
      {/* 👇 Submit stays disabled until the form validates! */}
      <input type="submit" disabled={!enabled} /> {/* submit button, disabled if form invalid */}
    </form>
  )
}