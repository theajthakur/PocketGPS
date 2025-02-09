import React from "react";
import { FaTriangleExclamation } from "react-icons/fa6";
import { Link } from "react-router-dom";
export default function History() {
  return (
    <div class="bg-dark vh-100">
      <div className="row justify-content-center vh-100 align-items-center">
        <div className="col-sm-10 col-md-8 col-lg-6 col-xl-4">
          <div className="card">
            <div className="card-header">
              <h3 className="m-0 text-center">History</h3>
            </div>
            <div className="card-body">
              <div className="alert alert-warning text-center">
                <p className="p-0 m-0">This Feature will be Available Soon</p>
              </div>
              <div
                className="text-center"
                style={{ fontSize: "3rem", color: "grey" }}
              >
                <FaTriangleExclamation />
              </div>
              <div className="text-center mt-5">
                <Link className="btn btn-warning" to="/PocketGPS">
                  Back to Map
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
