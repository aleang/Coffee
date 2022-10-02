import React, { useEffect, useState, useRef } from "react";
import './App.css';

const orderExample = `0900 1730
2022-03-17 10:17:06 001
2022-03-21 09:00 2
2022-03-16 12:34:56 002
2022-03-21 09:00 2`;

function App() {
  const [order, setOrder] = useState('');
  const [serverResponse, setResponse] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const coffeeOrderInput = useRef();

  useEffect(() => {
    if (!isLoading) return;

    fetch("http://localhost:8080/coffee-order-creation", {
      method: 'POST',
      mode: 'cors',
      headers: new Headers({
        "Content-Type": "text/plain",
        "Accept": "text/plain"
      }),
      body: order
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setResponse(data.deliverySchedule)
        setLoading(false)
      })
      .catch((error) => {
        setResponse(error.message)
        setLoading(false)
      });
  }, [order, isLoading]);

  const placeOrder = () => {
    const orderTextareaDom = document.getElementById("orderTextarea")
    setOrder(orderTextareaDom.value.trim())
    setLoading(true)
    setResponse("")
  }

  const dismissOutput = () => {
    setResponse(null);
    coffeeOrderInput.current.focus();
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>☕</h1>
        <div className={`place-order ${!!serverResponse ? "shortest" : ""} ${isLoading ? "shorter" : ""} `}>
          <p>Place coffee orders</p>
          
          <textarea id="orderTextarea" placeholder={orderExample} data-testid="coffee-order-input" ref={coffeeOrderInput}>
          </textarea>
  
          <input type="submit" value="Place Order" onClick={() => placeOrder()} data-testid="submit-button" />
        
        </div>
        { isLoading && <span className="loading" data-testid="loading-icon">⌛</span>}
        { serverResponse && 
          <pre className="after-order" >
            <span data-testid="coffee-order-output">{serverResponse}</span>
            <span className="close" onClick={() => { dismissOutput()}} data-testid="dismiss-output">x</span>
          </pre>
        }

      </header>
    </div>
  );
}

export default App;
