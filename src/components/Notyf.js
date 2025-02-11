import { Notyf } from "notyf";
import "notyf/notyf.min.css";

const notyf = new Notyf({
  duration: 3000,
  position: {
    x: "right",
    y: "top",
  },
  types: [
    {
      type: "success",
      background: "green",
      icon: {
        className: "fa fa-check",
        tagName: "span",
        color: "white",
      },
    },
    {
      type: "error",
      background: "red",
      icon: {
        className: "fa fa-times",
        tagName: "span",
        color: "white",
      },
    },
  ],
});

export default notyf;
