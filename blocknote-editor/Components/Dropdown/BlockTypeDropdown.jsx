import { useSelector } from "react-redux";
import "./BlockTypeDropdown.less";

// Import assets - BlockOptions
import H1 from 'src/assets/images/icons/h1.svg';
import H2 from 'src/assets/images/icons/h2.svg';
import H3 from 'src/assets/images/icons/h3.svg';
import Paragraph from 'src/assets/images/icons/paragraph.svg';
import Quote from 'src/assets/images/icons/quote.svg';
import NumberedList from 'src/assets/images/icons/numbered-list.svg';
import BulletedList from 'src/assets/images/icons/bulleted-list.svg';
import CheckList from 'src/assets/images/icons/check-list.svg';
import { PageTitleIcon } from '../constants';

// Import assets - Others
import DownArrow from 'src/assets/images/icons/pages-down-arrow.svg';
import { updateBgColor } from "../updateBgColor";
import { isOnCoverPage } from 'src/components/PagesComponents/coverpageCommonHelpers';

const BlockTypeDropdown = ({
    cb,
    isOpen,
    onToggle,
    selectedLabel = "Paragraph",
    setSelectedLabel,
    editor
  }) => {
    const json_metadata = useSelector((state) => state?.dashboardInfo?.metadata);
    // Conditionally create block options based on whether we're on a cover page
const getBlockOptions = () => {
const baseOptions = [
  { label: "Heading 1", tag: <H1 /> },
  { label: "Heading 2", tag: <H2 /> },
  { label: "Heading 3", tag: <H3 /> },
  { label: "Paragraph", tag: <Paragraph /> },
  { label: "Quote", tag: <Quote /> },
  { label: "Numbered List", tag: <NumberedList /> },
  { label: "Bullet List", tag: <BulletedList /> },
  { label: "Check List", tag: <CheckList /> },
];
      
      // Add Page Title as first option only on cover pages
      if (editor && isOnCoverPage(editor)) {
        return [{ label: "Page Title", tag: <PageTitleIcon />, displayLabel: "Page Title" }, ...baseOptions];
      }
      return baseOptions;
    };
    
    const blockOptions = getBlockOptions();
    const selected = blockOptions.find(opt => opt.label === selectedLabel) || 
                    (editor && isOnCoverPage(editor) ? blockOptions[0] : blockOptions[3]); // fallback to Page Title on cover page, otherwise Paragraph
    
    const handleSelect = (option) => {
      setSelectedLabel?.(option.label);
      onToggle?.(); // close dropdown
      cb(option?.label);
        updateBgColor(json_metadata?.slide_color, json_metadata?.coverImage);
    };
  
    return (
      <div className="pages dropdown-container">
        <button className="dropdown-trigger" onClick={onToggle}>
          <span className="dropdown-tag">{selected.tag}</span>
          <span className="dropdown-label">
            {selected.label === "Numbered List" ? "Numbered..." : 
             selected.displayLabel || selected.label}
          </span>
          <span className="dropdown-chevron"><DownArrow /></span>
        </button>
  
        <div className={`dropdown-menu-pages ${isOpen ? 'show' : ''}`}>
          {blockOptions.map((option) => (
              <div
                  key={option.label}
                  className={`dropdown-item ${selected.label === option.label ? "selected" : ""}`}
                  onMouseDown={() => handleSelect(option)}
              >
                  <span className="dropdown-tag">{option.tag}</span>
                  <span className="dropdown-label">{option.displayLabel || option.label}</span>
              </div>
          ))}
        </div>
      </div>
    );
};  

export default BlockTypeDropdown;
