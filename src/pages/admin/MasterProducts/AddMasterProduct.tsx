// FILE PATH: src/pages/admin/MasterProducts/AddMasterProduct.tsx

/**
 * Add Master Product Page
 * 
 * Placeholder page for adding new master products.
 * We'll implement the full form in the next step.
 */

import React from 'react';
import { Link } from 'react-router-dom';

const AddMasterProduct = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link to="/admin/master-products" className="hover:text-blue-600">
                Master Products
              </Link>
            </li>
            <li>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li className="text-gray-900 font-medium">Add Product</li>
          </ol>
        </nav>

        {/* Page Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Add</h1>
          <p className="text-gray-600">
            Add new master product form will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddMasterProduct;