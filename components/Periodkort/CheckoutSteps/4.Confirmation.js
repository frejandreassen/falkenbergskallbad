import React from "react";

const Confirmation = () => {
  return (
    <div className="space-y-4 my-10">
      <h3 className="text-2xl font-bold">Tack för din beställning!</h3>
      <p className="text-gray-600">Din beställning är bekräftad.</p>
      <p className="text-gray-600">
        Information om ditt nya bastukort har skickats till din e-post.
      </p>
      <p className="text-gray-600">
        Vi hoppas att du kommer ha mycket nytta av ditt nya kort!
      </p>
    </div>
  );
};

export default Confirmation;
