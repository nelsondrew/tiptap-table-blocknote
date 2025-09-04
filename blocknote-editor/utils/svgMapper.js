import { PageTitleIcon } from '../Components/constants';

const getSVG = {
  Bold: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-bold"
    >
      <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />
    </svg>
  ),
  Italic: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-italic"
    >
      <line x1="19" x2="10" y1="4" y2="4" />
      <line x1="14" x2="5" y1="20" y2="20" />
      <line x1="15" x2="9" y1="4" y2="20" />
    </svg>
  ),
  Strike: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-strikethrough"
    >
      <path d="M16 4H9a3 3 0 0 0-2.83 4" />
      <path d="M14 12a4 4 0 0 1 0 8H6" />
      <line x1="4" x2="20" y1="12" y2="12" />
    </svg>
  ),
  "Two Columns": (
    <svg
      width="13.333008"
      height="13.333496"
      viewBox="0 0 13.333 13.3335"
      fill="none"
    >
      <defs />
      <path
        id="Union"
        d="M0 2C0 0.895508 0.895508 0 2 0L11.333 0C12.4375 0 13.333 0.895508 13.333 2L13.333 11.3335C13.333 12.438 12.4375 13.3335 11.333 13.3335L2 13.3335C0.895508 13.3335 0 12.438 0 11.3335L0 2ZM7.33301 12L11.333 12C11.7012 12 12 11.7017 12 11.3335L12 2C12 1.63184 11.7012 1.3335 11.333 1.3335L7.33301 1.3335L7.33301 12ZM6 1.3335L6 12L2 12C1.63184 12 1.33301 11.7017 1.33301 11.3335L1.33301 2C1.33301 1.63184 1.63184 1.3335 2 1.3335L6 1.3335Z"
        clip-rule="evenodd"
        fill="#000000"
        fill-opacity="1.000000"
        fill-rule="evenodd"
      />
    </svg>
  ),
  "Three Columns": (
    <svg
      width="13.333008"
      height="13.333496"
      viewBox="0 0 13.333 13.3335"
      fill="none"
    >
      <defs />
      <path
        id="Union"
        d="M2 0C0.895508 0 0 0.895508 0 2L0 11.3335C0 12.438 0.895508 13.3335 2 13.3335L11.333 13.3335C12.4375 13.3335 13.333 12.438 13.333 11.3335L13.333 2C13.333 0.895508 12.4375 0 11.333 0L2 0ZM8 1.3335L5.33301 1.3335L5.33301 12L8 12L8 1.3335ZM9.33301 12L9.33301 1.3335L11.333 1.3335C11.7012 1.3335 12 1.63184 12 2L12 11.3335C12 11.7017 11.7012 12 11.333 12L9.33301 12ZM4 12L4 1.3335L2 1.3335C1.63184 1.3335 1.33301 1.63184 1.33301 2L1.33301 11.3335C1.33301 11.7017 1.63184 12 2 12L4 12Z"
        clip-rule="evenodd"
        fill="#000000"
        fill-opacity="1.000000"
        fill-rule="evenodd"
      />
    </svg>
  ),
  Code: (
    <svg
      width="24.000000"
      height="24.000000"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        id="Frame"
        rx="0.000000"
        width="15.000000"
        height="15.000000"
        transform="translate(0.500000 0.500000)"
        fill="#FFFFFF"
        fill-opacity="0"
      />
      <g clip-path="url(#clip31_129047)">
        <path
          id="Vector (Stroke)"
          d="M7.08 5.81C7.37 6.04 7.41 6.46 7.18 6.74L6.18 8L7.18 9.25C7.41 9.53 7.37 9.95 7.08 10.18C6.79 10.41 6.37 10.37 6.14 10.08L4.81 8.41C4.61 8.17 4.61 7.82 4.81 7.58L6.14 5.91C6.37 5.62 6.79 5.58 7.08 5.81Z"
          fill="#000000"
          fill-opacity="1.000000"
          fill-rule="evenodd"
        />
        <path
          id="Vector (Stroke)"
          d="M8.91 5.81C9.2 5.58 9.62 5.62 9.85 5.91L11.18 7.58C11.38 7.82 11.38 8.17 11.18 8.41L9.85 10.08C9.62 10.37 9.2 10.41 8.91 10.18C8.62 9.95 8.58 9.53 8.81 9.25L9.81 8L8.81 6.74C8.58 6.46 8.62 6.04 8.91 5.81Z"
          fill="#000000"
          fill-opacity="1.000000"
          fill-rule="evenodd"
        />
        <path
          id="Vector (Stroke)"
          d="M3.33 2.66C2.96 2.66 2.66 2.96 2.66 3.33L2.66 12.66C2.66 13.03 2.96 13.33 3.33 13.33L12.66 13.33C13.03 13.33 13.33 13.03 13.33 12.66L13.33 3.33C13.33 2.96 13.03 2.66 12.66 2.66L3.33 2.66ZM1.33 3.33C1.33 2.22 2.22 1.33 3.33 1.33L12.66 1.33C13.77 1.33 14.66 2.22 14.66 3.33L14.66 12.66C14.66 13.77 13.77 14.66 12.66 14.66L3.33 14.66C2.22 14.66 1.33 13.77 1.33 12.66L1.33 3.33Z"
          fill="#000000"
          fill-opacity="1.000000"
          fill-rule="evenodd"
        />
      </g>
    </svg>
  ),
  Paragraph: (
    <svg width="12.000000" height="12.000000" viewBox="0 0 12 12" fill="none">
      <defs />
      <path
        id="Union"
        d="M0.666992 0C0.298828 0 0 0.298462 0 0.666626L0 2.66663C0 3.03491 0.298828 3.33337 0.666992 3.33337C1.03516 3.33337 1.33301 3.03491 1.33301 2.66663L1.33301 1.33337L5.33301 1.33337L5.33301 10.6666L4 10.6666C3.63184 10.6666 3.33301 10.9651 3.33301 11.3334C3.33301 11.7015 3.63184 12 4 12L8 12C8.36816 12 8.66699 11.7015 8.66699 11.3334C8.66699 10.9651 8.36816 10.6666 8 10.6666L6.66699 10.6666L6.66699 1.33337L10.667 1.33337L10.667 2.66663C10.667 3.03491 10.9648 3.33337 11.333 3.33337C11.7012 3.33337 12 3.03491 12 2.66663L12 0.666626C12 0.298462 11.7012 0 11.333 0L0.666992 0Z"
        clip-rule="evenodd"
        fill="#000000"
        fill-opacity="1.000000"
        fill-rule="evenodd"
      />
    </svg>
  ),
  Quote: (
    <svg width="16.000000" height="16.000000" viewBox="0 0 16 16" fill="none">
      <defs>
        <clipPath id="clip30_121397">
          <rect
            id="Frame"
            rx="0.000000"
            width="15.000000"
            height="15.000000"
            transform="translate(0.500000 0.500000)"
            fill="white"
            fill-opacity="0"
          />
        </clipPath>
      </defs>
      <rect
        id="Frame"
        rx="0.000000"
        width="15.000000"
        height="15.000000"
        transform="translate(0.500000 0.500000)"
        fill="#FFFFFF"
        fill-opacity="0"
      />
      <g clip-path="url(#clip30_121397)">
        <path
          id="Vector (Stroke)"
          d="M1.33 3.99C1.33 3.63 1.63 3.33 2 3.33L11.33 3.33C11.7 3.33 12 3.63 12 3.99C12 4.36 11.7 4.66 11.33 4.66L2 4.66C1.63 4.66 1.33 4.36 1.33 3.99Z"
          fill="#000000"
          fill-opacity="1.000000"
          fill-rule="evenodd"
        />
        <path
          id="Vector (Stroke)"
          d="M4.66 8C4.66 7.63 4.96 7.33 5.33 7.33L14 7.33C14.36 7.33 14.66 7.63 14.66 8C14.66 8.36 14.36 8.66 14 8.66L5.33 8.66C4.96 8.66 4.66 8.36 4.66 8Z"
          fill="#000000"
          fill-opacity="1.000000"
          fill-rule="evenodd"
        />
        <path
          id="Vector (Stroke)"
          d="M4.66 12C4.66 11.63 4.96 11.33 5.33 11.33L14 11.33C14.36 11.33 14.66 11.63 14.66 12C14.66 12.36 14.36 12.66 14 12.66L5.33 12.66C4.96 12.66 4.66 12.36 4.66 12Z"
          fill="#000000"
          fill-opacity="1.000000"
          fill-rule="evenodd"
        />
        <path
          id="Vector (Stroke)"
          d="M2 7.33C2.36 7.33 2.66 7.63 2.66 8L2.66 12C2.66 12.36 2.36 12.66 2 12.66C1.63 12.66 1.33 12.36 1.33 12L1.33 8C1.33 7.63 1.63 7.33 2 7.33Z"
          fill="#000000"
          fill-opacity="1.000000"
          fill-rule="evenodd"
        />
      </g>
    </svg>
  ),
  "Numbered List": (
    <svg width="16.000000" height="16.000000" viewBox="0 0 16 16" fill="none">
      <defs />
      <rect
        id="Editor/AddNumbersList"
        rx="0.000000"
        width="15.000000"
        height="15.000000"
        transform="translate(0.500000 0.500000)"
        fill="#FFFFFF"
        fill-opacity="0"
      />
      <path
        id="icon"
        d="M3.33 4.66L2.21 4.66L2.21 3.02L1.33 3.02L1.33 2.2C1.87 2.21 2.41 1.99 2.44 1.33L3.33 1.33L3.33 4.66ZM14 4.33L6 4.33C5.82 4.33 5.65 4.26 5.52 4.13C5.4 4.01 5.33 3.84 5.33 3.66C5.33 3.48 5.4 3.32 5.52 3.19C5.65 3.07 5.82 3 6 3L14 3C14.17 3 14.34 3.07 14.47 3.19C14.59 3.32 14.66 3.48 14.66 3.66C14.66 3.84 14.59 4.01 14.47 4.13C14.34 4.26 14.17 4.33 14 4.33ZM2.22 7.42C2.21 7.02 2.33 6.74 2.69 6.74C2.89 6.74 3.06 6.85 3.06 7.15C3.06 7.36 2.85 7.49 2.7 7.59C2.68 7.6 2.66 7.61 2.64 7.62C2.59 7.66 2.54 7.69 2.49 7.72C2.14 7.94 1.78 8.18 1.55 8.51C1.4 8.74 1.31 9.01 1.33 9.33L4 9.33L4 8.52L2.6 8.52L2.6 8.52C2.71 8.45 2.82 8.39 2.93 8.32C3.43 8.03 3.95 7.72 3.95 7.03C3.95 6.33 3.44 6 2.7 6C1.87 6 1.34 6.52 1.39 7.42L2.22 7.42ZM6 8.66L14 8.66C14.17 8.66 14.34 8.59 14.47 8.47C14.59 8.34 14.66 8.17 14.66 8C14.66 7.82 14.59 7.65 14.47 7.52C14.34 7.4 14.17 7.33 14 7.33L6 7.33C5.82 7.33 5.65 7.4 5.52 7.52C5.4 7.65 5.33 7.82 5.33 8C5.33 8.17 5.4 8.34 5.52 8.47C5.65 8.59 5.82 8.66 6 8.66ZM2.25 11.79C2.25 11.51 2.44 11.38 2.68 11.38C2.86 11.38 3.08 11.46 3.08 11.66C3.08 11.92 2.85 11.96 2.66 11.96C2.58 11.96 2.52 11.95 2.47 11.95C2.45 11.94 2.43 11.94 2.4 11.94L2.4 12.58C2.42 12.57 2.43 12.57 2.44 12.57C2.5 12.56 2.56 12.55 2.66 12.55C2.87 12.55 3.07 12.6 3.07 12.89C3.07 13.16 2.91 13.26 2.66 13.26C2.51 13.26 2.38 13.22 2.29 13.11C2.21 13.03 2.17 12.89 2.17 12.72L1.33 12.72C1.31 12.97 1.32 14 2.7 14C3.71 14 4 13.37 4 12.97C4 12.38 3.66 12.27 3.54 12.23C3.51 12.22 3.49 12.21 3.49 12.21L3.49 12.2C3.49 12.2 3.5 12.19 3.51 12.19C3.59 12.17 3.9 12.1 3.9 11.5C3.9 11.22 3.6 10.66 2.71 10.66C2.36 10.66 2.04 10.75 1.81 10.93C1.57 11.12 1.43 11.4 1.42 11.79L2.25 11.79ZM6 13L14 13C14.17 13 14.34 12.92 14.47 12.8C14.59 12.67 14.66 12.51 14.66 12.33C14.66 12.15 14.59 11.98 14.47 11.86C14.34 11.73 14.17 11.66 14 11.66L6 11.66C5.82 11.66 5.65 11.73 5.52 11.86C5.4 11.98 5.33 12.15 5.33 12.33C5.33 12.51 5.4 12.67 5.52 12.8C5.65 12.92 5.82 13 6 13Z"
        fill="#000000"
        fill-opacity="1.000000"
        fill-rule="evenodd"
      />
    </svg>
  ),
  "Bullet List": (
    <svg
      width="13.333008"
      height="10.000000"
      viewBox="0 0 13.333 10"
      fill="none"
    >
      <defs />
      <path
        id="icon"
        d="M1.33 0.66C1.33 0.29 1.03 0 0.66 0C0.29 0 0 0.29 0 0.66C0 1.03 0.29 1.33 0.66 1.33C1.03 1.33 1.33 1.03 1.33 0.66ZM12.66 1.33L4.66 1.33C4.49 1.33 4.32 1.26 4.19 1.13C4.07 1.01 4 0.84 4 0.66C4 0.48 4.07 0.32 4.19 0.19C4.32 0.07 4.49 0 4.66 0L12.66 0C12.84 0 13.01 0.07 13.13 0.19C13.26 0.32 13.33 0.48 13.33 0.66C13.33 0.84 13.26 1.01 13.13 1.13C13.01 1.26 12.84 1.33 12.66 1.33ZM1.33 5C1.33 4.63 1.03 4.33 0.66 4.33C0.29 4.33 0 4.63 0 5C0 5.36 0.29 5.66 0.66 5.66C1.03 5.66 1.33 5.36 1.33 5ZM12.66 5.66L4.66 5.66C4.49 5.66 4.32 5.59 4.19 5.47C4.07 5.34 4 5.17 4 5C4 4.82 4.07 4.65 4.19 4.52C4.32 4.4 4.49 4.33 4.66 4.33L12.66 4.33C12.84 4.33 13.01 4.4 13.13 4.52C13.26 4.65 13.33 4.82 13.33 5C13.33 5.17 13.26 5.34 13.13 5.47C13.01 5.59 12.84 5.66 12.66 5.66ZM1.33 9.33C1.33 8.96 1.03 8.66 0.66 8.66C0.29 8.66 0 8.96 0 9.33C0 9.7 0.29 10 0.66 10C1.03 10 1.33 9.7 1.33 9.33ZM12.66 10L4.66 10C4.49 10 4.32 9.92 4.19 9.8C4.07 9.67 4 9.51 4 9.33C4 9.15 4.07 8.98 4.19 8.86C4.32 8.73 4.49 8.66 4.66 8.66L12.66 8.66C12.84 8.66 13.01 8.73 13.13 8.86C13.26 8.98 13.33 9.15 13.33 9.33C13.33 9.51 13.26 9.67 13.13 9.8C13.01 9.92 12.84 10 12.66 10Z"
        fill="#000000"
        fill-opacity="1.000000"
        fill-rule="evenodd"
      />
    </svg>
  ),
  "Heading 1": (
    <svg width="16.000000" height="16.000000" viewBox="0 0 16 16" fill="none">
      <defs>
        <clipPath id="clip30_121223">
          <rect
            id="Frame"
            rx="0.000000"
            width="15.000000"
            height="15.000000"
            transform="translate(0.500000 0.500000)"
            fill="white"
            fill-opacity="0"
          />
        </clipPath>
      </defs>
      <rect
        id="Frame"
        rx="0.000000"
        width="15.000000"
        height="15.000000"
        transform="translate(0.500000 0.500000)"
        fill="#FFFFFF"
        fill-opacity="0"
      />
      <g clip-path="url(#clip30_121223)">
        <path
          id="Union"
          d="M3.33301 4C3.33301 3.63184 3.03516 3.33337 2.66699 3.33337C2.29883 3.33337 2 3.63184 2 4L2 12C2 12.3683 2.29883 12.6667 2.66699 12.6667C3.03516 12.6667 3.33301 12.3683 3.33301 12L3.33301 8.66675L7.33301 8.66675L7.33301 12C7.33301 12.3683 7.63184 12.6667 8 12.6667C8.36816 12.6667 8.66699 12.3683 8.66699 12L8.66699 4C8.66699 3.63184 8.36816 3.33337 8 3.33337C7.63184 3.33337 7.33301 3.63184 7.33301 4L7.33301 7.33337L3.33301 7.33337L3.33301 4ZM14 6.66675C14 6.4209 13.8652 6.19495 13.6484 6.07898C13.4316 5.96289 13.168 5.97559 12.9639 6.11206L10.9639 7.44531C10.6572 7.64954 10.5742 8.06348 10.7783 8.36987C10.9834 8.67615 11.3965 8.75903 11.7031 8.55469L12.667 7.91235L12.667 12C12.667 12.3683 12.9648 12.6667 13.333 12.6667C13.7012 12.6667 14 12.3683 14 12L14 6.66675Z"
          clip-rule="evenodd"
          fill="#000000"
          fill-opacity="1.000000"
          fill-rule="evenodd"
        />
      </g>
    </svg>
  ),
  "Heading 2": (
    <svg width="16.000000" height="16.000000" viewBox="0 0 16 16" fill="none">
      <defs>
        <clipPath id="clip30_121245">
          <rect
            id="Frame"
            rx="0.000000"
            width="15.000000"
            height="15.000000"
            transform="translate(0.500000 0.500000)"
            fill="white"
            fill-opacity="0"
          />
        </clipPath>
      </defs>
      <rect
        id="Frame"
        rx="0.000000"
        width="15.000000"
        height="15.000000"
        transform="translate(0.500000 0.500000)"
        fill="#FFFFFF"
        fill-opacity="0"
      />
      <g clip-path="url(#clip30_121245)">
        <path
          id="Union"
          d="M3.33301 4C3.33301 3.63184 3.03516 3.33337 2.66699 3.33337C2.29883 3.33337 2 3.63184 2 4L2 12C2 12.3683 2.29883 12.6667 2.66699 12.6667C3.03516 12.6667 3.33301 12.3683 3.33301 12L3.33301 8.66675L7.33301 8.66675L7.33301 12C7.33301 12.3683 7.63184 12.6667 8 12.6667C8.36816 12.6667 8.66699 12.3683 8.66699 12L8.66699 4C8.66699 3.63184 8.36816 3.33337 8 3.33337C7.63184 3.33337 7.33301 3.63184 7.33301 4L7.33301 7.33337L3.33301 7.33337L3.33301 4ZM14.667 8C14.667 7.17407 14.1104 6.52869 13.3779 6.2843C12.6367 6.03723 11.7451 6.19153 10.9336 6.80005C10.6387 7.021 10.5791 7.43884 10.7998 7.7334C11.0205 8.02795 11.4385 8.08765 11.7334 7.8667C12.2549 7.47522 12.6973 7.46289 12.9561 7.54919C13.2227 7.63806 13.333 7.82593 13.333 8C13.333 8.32263 13.2373 8.49194 13.1025 8.63208C12.9521 8.78918 12.7588 8.90869 12.4707 9.08716C12.4209 9.1178 12.3691 9.15015 12.3135 9.18469C11.9717 9.39844 11.542 9.68408 11.2109 10.1392C10.8672 10.6118 10.667 11.2122 10.667 12C10.667 12.3683 10.9648 12.6667 11.333 12.6667L14 12.6667C14.3682 12.6667 14.667 12.3683 14.667 12C14.667 11.6318 14.3682 11.3334 14 11.3334L12.0869 11.3334C12.1396 11.1614 12.2119 11.0299 12.2891 10.9235C12.458 10.691 12.6953 10.5183 13.0205 10.3154C13.0596 10.2904 13.1025 10.2644 13.1475 10.2371C13.4258 10.066 13.7852 9.84583 14.0645 9.55542C14.4297 9.1748 14.667 8.67737 14.667 8Z"
          clip-rule="evenodd"
          fill="#000000"
          fill-opacity="1.000000"
          fill-rule="evenodd"
        />
      </g>
    </svg>
  ),
  "Heading 3": (
    <svg width="16.000000" height="16.000000" viewBox="0 0 16 16" fill="none">
      <defs>
        <clipPath id="clip30_121268">
          <rect
            id="Frame"
            rx="0.000000"
            width="15.000000"
            height="15.000000"
            transform="translate(0.500000 0.500000)"
            fill="white"
            fill-opacity="0"
          />
        </clipPath>
      </defs>
      <rect
        id="Frame"
        rx="0.000000"
        width="15.000000"
        height="15.000000"
        transform="translate(0.500000 0.500000)"
        fill="#FFFFFF"
        fill-opacity="0"
      />
      <g clip-path="url(#clip30_121268)">
        <path
          id="Union"
          d="M2.66699 3.33337C3.03516 3.33337 3.33301 3.63184 3.33301 4L3.33301 7.33337L7.33301 7.33337L7.33301 4C7.33301 3.63184 7.63184 3.33337 8 3.33337C8.36816 3.33337 8.66699 3.63184 8.66699 4L8.66699 12C8.66699 12.3683 8.36816 12.6667 8 12.6667C7.63184 12.6667 7.33301 12.3683 7.33301 12L7.33301 8.66675L3.33301 8.66675L3.33301 12C3.33301 12.3683 3.03516 12.6667 2.66699 12.6667C2.29883 12.6667 2 12.3683 2 12L2 4C2 3.63184 2.29883 3.33337 2.66699 3.33337Z"
          clip-rule="evenodd"
          fill="#000000"
          fill-opacity="1.000000"
          fill-rule="evenodd"
        />
        <path
          id="Union"
          d="M12.9746 7.47791C12.7432 7.36877 12.3926 7.34692 12.0049 7.57458C11.6875 7.76135 11.2793 7.6554 11.0928 7.33801C10.9053 7.02063 11.0117 6.61206 11.3291 6.42542C12.0752 5.98645 12.8916 5.9646 13.543 6.27209C14.1895 6.57703 14.667 7.21191 14.667 8C14.667 8.49316 14.4844 8.96765 14.1582 9.33337C14.4844 9.69897 14.667 10.1735 14.667 10.6666C14.667 11.5236 14.1846 12.2648 13.4404 12.5996C12.6846 12.9401 11.7617 12.821 10.9336 12.2C10.6387 11.9791 10.5791 11.5613 10.8008 11.2667C11.0215 10.9722 11.4395 10.9125 11.7334 11.1333C12.2393 11.5123 12.6504 11.4933 12.8936 11.3837C13.1494 11.2687 13.334 11.0099 13.334 10.6666C13.334 10.4899 13.2637 10.3203 13.1387 10.1953C13.0137 10.0702 12.8438 10 12.667 10C12.2988 10 12 9.70154 12 9.33337C12 8.96509 12.2988 8.66663 12.667 8.66663C12.8438 8.66663 13.0137 8.59644 13.1387 8.47144C13.2637 8.34644 13.334 8.17676 13.334 8C13.334 7.78809 13.2109 7.5896 12.9746 7.47791Z"
          clip-rule="evenodd"
          fill="#000000"
          fill-opacity="1.000000"
          fill-rule="evenodd"
        />
      </g>
    </svg>
  ),
  "Page Title": PageTitleIcon(),
  "Check List": (
    <svg width="16.000000" height="16.000000" viewBox="0 0 16 16" fill="none">
      <defs>
        <clipPath id="clip30_121455">
          <rect
            id="Frame"
            rx="0.000000"
            width="15.000000"
            height="15.000000"
            transform="translate(0.500000 0.500000)"
            fill="white"
            fill-opacity="0"
          />
        </clipPath>
      </defs>
      <rect
        id="Frame"
        rx="0.000000"
        width="15.000000"
        height="15.000000"
        transform="translate(0.500000 0.500000)"
        fill="#FFFFFF"
        fill-opacity="0"
      />
      <g clip-path="url(#clip30_121455)">
        <path
          id="Vector (Stroke)"
          d="M6.47 9.52C6.73 9.78 6.73 10.21 6.47 10.47L3.8 13.13C3.54 13.39 3.12 13.39 2.86 13.13L1.52 11.8C1.26 11.54 1.26 11.12 1.52 10.86C1.78 10.6 2.21 10.6 2.47 10.86L3.33 11.72L5.52 9.52C5.78 9.26 6.21 9.26 6.47 9.52Z"
          fill="#000000"
          fill-opacity="1.000000"
          fill-rule="evenodd"
        />
        <path
          id="Vector (Stroke)"
          d="M6.47 2.86C6.73 3.12 6.73 3.54 6.47 3.8L3.8 6.47C3.54 6.73 3.12 6.73 2.86 6.47L1.52 5.13C1.26 4.87 1.26 4.45 1.52 4.19C1.78 3.93 2.21 3.93 2.47 4.19L3.33 5.05L5.52 2.86C5.78 2.6 6.21 2.6 6.47 2.86Z"
          fill="#000000"
          fill-opacity="1.000000"
          fill-rule="evenodd"
        />
        <path
          id="Vector (Stroke)"
          d="M8 4C8 3.63 8.29 3.33 8.66 3.33L14 3.33C14.36 3.33 14.66 3.63 14.66 4C14.66 4.36 14.36 4.66 14 4.66L8.66 4.66C8.29 4.66 8 4.36 8 4Z"
          fill="#000000"
          fill-opacity="1.000000"
          fill-rule="evenodd"
        />
        <path
          id="Vector (Stroke)"
          d="M8 8C8 7.63 8.29 7.33 8.66 7.33L14 7.33C14.36 7.33 14.66 7.63 14.66 8C14.66 8.36 14.36 8.66 14 8.66L8.66 8.66C8.29 8.66 8 8.36 8 8Z"
          fill="#000000"
          fill-opacity="1.000000"
          fill-rule="evenodd"
        />
        <path
          id="Vector (Stroke)"
          d="M8 12C8 11.63 8.29 11.33 8.66 11.33L14 11.33C14.36 11.33 14.66 11.63 14.66 12C14.66 12.36 14.36 12.66 14 12.66L8.66 12.66C8.29 12.66 8 12.36 8 12Z"
          fill="#000000"
          fill-opacity="1.000000"
          fill-rule="evenodd"
        />
      </g>
    </svg>
  ),
  "Code Block": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="16"
      viewBox="0 0 17 16"
      fill="none"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M7.17916 5.81274C7.46667 6.04274 7.51328 6.46227 7.28327 6.74978L6.28311 7.99998L7.28327 9.25019C7.51328 9.53769 7.46667 9.95722 7.17916 10.1872C6.89165 10.4172 6.47212 10.3706 6.24212 10.0831L4.90878 8.41645C4.714 8.17297 4.714 7.827 4.90878 7.58352L6.24212 5.91685C6.47212 5.62935 6.89165 5.58273 7.17916 5.81274Z"
        fill="black"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M9.01292 5.81274C9.30043 5.58273 9.71996 5.62935 9.94997 5.91685L11.2833 7.58352C11.4781 7.827 11.4781 8.17297 11.2833 8.41645L9.94997 10.0831C9.71996 10.3706 9.30043 10.4172 9.01292 10.1872C8.72542 9.95722 8.6788 9.53769 8.90881 9.25019L9.90897 7.99998L8.90881 6.74978C8.6788 6.46227 8.72542 6.04274 9.01292 5.81274Z"
        fill="black"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M3.42871 2.66671C3.06052 2.66671 2.76204 2.96518 2.76204 3.33337V12.6667C2.76204 13.0349 3.06052 13.3334 3.42871 13.3334H12.762C13.1302 13.3334 13.4287 13.0349 13.4287 12.6667V3.33337C13.4287 2.96518 13.1302 2.66671 12.762 2.66671H3.42871ZM1.42871 3.33337C1.42871 2.2288 2.32414 1.33337 3.42871 1.33337H12.762C13.8666 1.33337 14.762 2.2288 14.762 3.33337V12.6667C14.762 13.7713 13.8666 14.6667 12.762 14.6667H3.42871C2.32414 14.6667 1.42871 13.7713 1.42871 12.6667V3.33337Z"
        fill="black"
      />
    </svg>
  ),
  "Ordered List": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-list-ordered"
    >
      <path d="M10 12h11" />
      <path d="M10 18h11" />
      <path d="M10 6h11" />
      <path d="M4 10h2" />
      <path d="M4 6h1v4" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </svg>
  ),
  "Code Block": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="16"
      viewBox="0 0 17 16"
      fill="none"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M7.17916 5.81274C7.46667 6.04274 7.51328 6.46227 7.28327 6.74978L6.28311 7.99998L7.28327 9.25019C7.51328 9.53769 7.46667 9.95722 7.17916 10.1872C6.89165 10.4172 6.47212 10.3706 6.24212 10.0831L4.90878 8.41645C4.714 8.17297 4.714 7.827 4.90878 7.58352L6.24212 5.91685C6.47212 5.62935 6.89165 5.58273 7.17916 5.81274Z"
        fill="black"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M9.01292 5.81274C9.30043 5.58273 9.71996 5.62935 9.94997 5.91685L11.2833 7.58352C11.4781 7.827 11.4781 8.17297 11.2833 8.41645L9.94997 10.0831C9.71996 10.3706 9.30043 10.4172 9.01292 10.1872C8.72542 9.95722 8.6788 9.53769 8.90881 9.25019L9.90897 7.99998L8.90881 6.74978C8.6788 6.46227 8.72542 6.04274 9.01292 5.81274Z"
        fill="black"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M3.42871 2.66671C3.06052 2.66671 2.76204 2.96518 2.76204 3.33337V12.6667C2.76204 13.0349 3.06052 13.3334 3.42871 13.3334H12.762C13.1302 13.3334 13.4287 13.0349 13.4287 12.6667V3.33337C13.4287 2.96518 13.1302 2.66671 12.762 2.66671H3.42871ZM1.42871 3.33337C1.42871 2.2288 2.32414 1.33337 3.42871 1.33337H12.762C13.8666 1.33337 14.762 2.2288 14.762 3.33337V12.6667C14.762 13.7713 13.8666 14.6667 12.762 14.6667H3.42871C2.32414 14.6667 1.42871 13.7713 1.42871 12.6667V3.33337Z"
        fill="black"
      />
    </svg>
  ),
  Blockquote: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-text-quote"
    >
      <path d="M17 6H3" />
      <path d="M21 12H8" />
      <path d="M21 18H8" />
      <path d="M3 12v6" />
    </svg>
  ),
  "Horizontal Rule": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-minus"
    >
      <path d="M5 12h14" />
    </svg>
  ),
  Image: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-image"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  ),
  Video: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-clapperboard"
    >
      <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" />
      <path d="m6.2 5.3 3.1 3.9" />
      <path d="m12.4 3.4 3.1 4" />
      <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  ),
  Chart: (
    <svg
      width="13.333008"
      height="13.330688"
      viewBox="0 0 13.333 13.3307"
      fill="none"
    >
      <defs />
      <path
        id="icon"
        d="M6.19 0.19C6.32 0.07 6.49 0 6.66 0C7.54 0 8.4 0.17 9.21 0.5C10.02 0.84 10.76 1.33 11.38 1.95C12 2.57 12.49 3.3 12.82 4.11C13.16 4.92 13.33 5.79 13.33 6.66C13.33 7.03 13.03 7.33 12.66 7.33L6.66 7.33C6.29 7.33 6 7.03 6 6.66L6 0.66C6 0.48 6.07 0.32 6.19 0.19ZM4.87 0.89C5.02 1.23 4.87 1.62 4.53 1.77C3.73 2.12 3.03 2.66 2.49 3.34C1.95 4.02 1.58 4.83 1.42 5.68C1.26 6.54 1.31 7.42 1.57 8.25C1.83 9.08 2.29 9.84 2.91 10.45C3.53 11.06 4.29 11.52 5.13 11.77C5.96 12.02 6.84 12.06 7.7 11.89C8.55 11.72 9.35 11.35 10.03 10.8C10.7 10.25 11.23 9.54 11.57 8.74C11.72 8.4 12.11 8.24 12.45 8.38C12.79 8.53 12.95 8.92 12.8 9.26C12.38 10.26 11.71 11.14 10.87 11.83C10.03 12.52 9.03 12.99 7.96 13.2C6.89 13.41 5.79 13.36 4.74 13.04C3.7 12.73 2.75 12.17 1.97 11.4C1.2 10.63 0.62 9.69 0.3 8.65C-0.03 7.61 -0.09 6.51 0.11 5.44C0.31 4.37 0.77 3.36 1.44 2.51C2.12 1.66 3 0.98 4 0.55C4.33 0.4 4.73 0.56 4.87 0.89ZM7.33 1.37L7.33 6L11.95 6C11.89 5.52 11.77 5.06 11.59 4.62C11.32 3.97 10.93 3.39 10.43 2.89C9.94 2.4 9.35 2 8.7 1.73C8.26 1.55 7.8 1.43 7.33 1.37Z"
        fill="#000000"
        fill-opacity="1.000000"
        fill-rule="evenodd"
      />
    </svg>
  ),
  Metrics: (
    <svg
      width="12.000000"
      height="14.666626"
      viewBox="0 0 12 14.6666"
      fill="none"
    >
      <defs />
      <path
        id="icon"
        d="M2 0C1.46 0 0.96 0.21 0.58 0.58C0.21 0.96 0 1.46 0 2L0 12.66C0 13.19 0.21 13.7 0.58 14.08C0.96 14.45 1.46 14.66 2 14.66L10 14.66C10.53 14.66 11.03 14.45 11.41 14.08C11.78 13.7 12 13.19 12 12.66L12 4C12 3.82 11.92 3.65 11.8 3.52L8.47 0.19C8.34 0.07 8.17 0 8 0L2 0ZM6.66 1.33L2 1.33C1.82 1.33 1.65 1.4 1.52 1.52C1.4 1.65 1.33 1.82 1.33 2L1.33 12.66C1.33 12.84 1.4 13.01 1.52 13.13C1.65 13.26 1.82 13.33 2 13.33L10 13.33C10.17 13.33 10.34 13.26 10.47 13.13C10.59 13.01 10.66 12.84 10.66 12.66L10.66 5.33L8.66 5.33C8.13 5.33 7.62 5.12 7.25 4.74C6.87 4.37 6.66 3.86 6.66 3.33L6.66 1.33ZM10.39 4L8.66 4C8.49 4 8.32 3.92 8.19 3.8C8.07 3.67 8 3.51 8 3.33L8 1.6L10.39 4ZM6.66 7.33C6.66 6.96 6.36 6.66 6 6.66C5.63 6.66 5.33 6.96 5.33 7.33L5.33 11.33C5.33 11.7 5.63 12 6 12C6.36 12 6.66 11.7 6.66 11.33L6.66 7.33ZM9.33 9.33C9.33 8.96 9.03 8.66 8.66 8.66C8.29 8.66 8 8.96 8 9.33L8 11.33C8 11.7 8.29 12 8.66 12C9.03 12 9.33 11.7 9.33 11.33L9.33 9.33ZM3.33 10C3.7 10 4 10.29 4 10.66L4 11.33C4 11.7 3.7 12 3.33 12C2.96 12 2.66 11.7 2.66 11.33L2.66 10.66C2.66 10.29 2.96 10 3.33 10Z"
        fill="#000000"
        fill-opacity="1.000000"
        fill-rule="evenodd"
      />
    </svg>
  ),
  Table: (
    <svg
      width="13.333008"
      height="13.333374"
      viewBox="0 0 13.333 13.3334"
      fill="none"
    >
      <defs />
      <path
        id="Union"
        d="M2 0C0.895508 0 0 0.895386 0 2L0 11.3334C0 12.4379 0.895508 13.3334 2 13.3334L11.333 13.3334C12.4375 13.3334 13.333 12.4379 13.333 11.3334L13.333 2C13.333 0.895386 12.4375 0 11.333 0L2 0ZM12 8L12 5.33337L7.33301 5.33337L7.33301 8L12 8ZM7.33301 9.33337L12 9.33337L12 11.3334C12 11.7015 11.7012 12 11.333 12L7.33301 12L7.33301 9.33337ZM6 8L6 5.33337L1.33301 5.33337L1.33301 8L6 8ZM1.33301 9.33337L6 9.33337L6 12L2 12C1.63184 12 1.33301 11.7015 1.33301 11.3334L1.33301 9.33337ZM1.33301 4L6 4L6 1.33337L2 1.33337C1.63184 1.33337 1.33301 1.63184 1.33301 2L1.33301 4ZM7.33301 4L12 4L12 2C12 1.63184 11.7012 1.33337 11.333 1.33337L7.33301 1.33337L7.33301 4Z"
        clip-rule="evenodd"
        fill="#000000"
        fill-opacity="1.000000"
        fill-rule="evenodd"
      />
    </svg>
  ),
  "Insert Table": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-grid-2x2"
    >
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),

  "Add Column Before": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-grid-2x2"
    >
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  "Add Column After": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-grid-2x2"
    >
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  "Add Row Before": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-grid-2x2"
    >
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  "Add Row After": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-grid-2x2"
    >
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  "Add Chart Cell Before": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-between-horizontal-start"
    >
      <rect width="13" height="7" x="8" y="3" rx="1" />
      <path d="m2 9 3 3-3 3" />
      <rect width="13" height="7" x="8" y="14" rx="1" />
    </svg>
  ),
  "Add Chart Cell After": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-between-horizontal-start"
    >
      <rect width="13" height="7" x="8" y="3" rx="1" />
      <path d="m2 9 3 3-3 3" />
      <rect width="13" height="7" x="8" y="14" rx="1" />
    </svg>
  ),
  "Delete Chart Cell": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-square-x"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  ),

  "Delete Table": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-grid-2x2-x"
    >
      <path d="M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3" />
      <path d="m16 16 5 5" />
      <path d="m16 21 5-5" />
    </svg>
  ),
    "Delete Row": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-grid-2x2-x"
    >
      <path d="M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3" />
      <path d="m16 16 5 5" />
      <path d="m16 21 5-5" />
    </svg>
  ),
    "Delete Column": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-grid-2x2-x"
    >
      <path d="M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3" />
      <path d="m16 16 5 5" />
      <path d="m16 21 5-5" />
    </svg>
  ),
  "Chart Table": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-chart-bar-big"
    >
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <rect x="7" y="13" width="9" height="4" rx="1" />
      <rect x="7" y="5" width="12" height="4" rx="1" />
    </svg>
  ),
  "Clear Marks": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-eraser"
    >
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </svg>
  ),
  "Clear Nodes": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-circle-x"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  ),
};

export { getSVG };
