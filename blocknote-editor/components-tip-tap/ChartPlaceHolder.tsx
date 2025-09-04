import React from 'react';
import styled from 'styled-components';

const PlaceholderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
`;

const Title = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: #666;
  margin-top: 16px;

  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
  letter-spacing: 1%;
  text-align: center;
  vertical-align: middle;
`;

const Subtitle = styled.div`
  font-size: 14px;
  color: #9C9C9C;
  text-align: center;
  max-width: 300px;

  font-weight: 400;
  line-height: 24px;
  letter-spacing: 1%;
  text-align: center;
  vertical-align: middle;
`;

interface ChartPlaceholderProps {
  source?: string;
}

const ChartPlaceholder: React.FC<ChartPlaceholderProps> = ({ source = 'chart' }) => {
  const getContent = () => {
    switch (source) {
      case 'metrics':
        return {
          title: 'Drag and Drop Metrics',
          subtitle: 'Add metrics, a pre-defined data visualization here'
        };
      default:
        return {
          title: 'Drag and Drop Elements and Charts',
          subtitle: 'You can create a new chart or use existing ones from the panel on the right'
        };
    }
  };

  const content = getContent();

  return (
    <PlaceholderContainer>
      <svg 
        width="62.001953" 
        height="62.003906" 
        viewBox="0 0 62.002 62.0039" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: 'scale(0.8)' }} 
      >
        <rect 
          id="Frame 1000003088" 
          rx="1.937561" 
          width="27.642658" 
          height="61.745560" 
          transform="translate(0.129171 0.129171)" 
          fill="#E5E5E5" 
          fillOpacity="1.000000"
        />
        <rect 
          id="Frame 1000003088" 
          rx="1.937561" 
          width="27.642658" 
          height="61.745560" 
          transform="translate(0.129171 0.129171)" 
          stroke="#E5E5E5" 
          strokeOpacity="1.000000" 
          strokeWidth="0.258341"
        />
        <rect 
          id="Rectangle 3581" 
          x="38.234375" 
          y="19.268066" 
          width="3.358439" 
          height="4.500792" 
          fill="#E5E5E5" 
          fillOpacity="1.000000"
        />
        <rect 
          id="Rectangle 3582" 
          x="43.660156" 
          y="13.862061" 
          width="3.358439" 
          height="9.904769" 
          fill="#E5E5E5" 
          fillOpacity="1.000000"
        />
        <rect 
          id="Rectangle 3583" 
          x="49.085938" 
          y="9.847656" 
          width="3.358439" 
          height="13.919152" 
          fill="#E5E5E5" 
          fillOpacity="1.000000"
        />
        <rect 
          id="Rectangle 3584" 
          x="54.509766" 
          y="4.133545" 
          width="3.358439" 
          height="19.633949" 
          fill="#E5E5E5" 
          fillOpacity="1.000000"
        />
        <rect 
          id="Frame 1000003088" 
          rx="1.679255" 
          width="27.126047" 
          height="27.127190" 
          transform="translate(34.489040 0.387476)" 
          stroke="#E5E5E5" 
          strokeOpacity="1.000000" 
          strokeWidth="0.774952"
        />
        <rect 
          id="Frame 1000003088" 
          rx="1.937561" 
          width="27.642658" 
          height="27.643801" 
          transform="translate(34.230732 34.230976)" 
          fill="#E5E5E5" 
          fillOpacity="1.000000"
        />
        <rect 
          id="Frame 1000003088" 
          rx="1.937561" 
          width="27.642658" 
          height="27.643801" 
          transform="translate(34.230732 34.230976)" 
          stroke="#E5E5E5" 
          strokeOpacity="1.000000" 
          strokeWidth="0.258341"
        />
      </svg>
      <Title>{content.title}</Title>
      <Subtitle>{content.subtitle}</Subtitle>
    </PlaceholderContainer>
  );
};

export default ChartPlaceholder; 