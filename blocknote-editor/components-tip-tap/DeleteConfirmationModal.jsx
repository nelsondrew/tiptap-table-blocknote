import React from 'react'
import styled from 'styled-components'
import Icons from 'src/components/Icons'

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(242, 242, 242, 0.60);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`

const ModalContent = styled.div`
  background: white;
  max-width: 400px;
  width: 90%;
  animation: slideUp 0.3s ease-out;
  transform-origin: center;
  border-radius: 8px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.06);
  max-width: 600px;
  padding: 0px;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  .modal-content {
    display: flex;
    justify-content: center;
    box-shadow: none;
  }
  .modal-close-icon {
    display: flex;
    align-items: center;
    justify-content: right;
    width: 100%;
    svg {
      width: 24px;
      height: 24px;
    }
  }
  .modal-title {
    gap: 8px;
    font-size: 22px;
    font-weight: 700;
    line-height: 32px;
    color: #000000;
    display: flex;
    align-items: center;
  }
`

const Title = styled.div`
  display: flex;
  align-items: center;
  align-self: stretch;
  flex-direction: column;
  padding: 32px 32px 16px;
  justify-content: center;
  svg {
    color: #E42121;
    width: 24px;
    height: 24px;
  }
`

const Message = styled.div`
    padding: 32px 0px;
    color: rgb(0, 0, 0);
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0.16px;
    display: inline-block;
    text-align: center;
    width: 461px;
    margin: 0px;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  padding: 16px 32px 32px 32px
`

const Button = styled.button`
  padding: 11px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 136px;
  min-height: 50px;

  &.cancel {
    background: white;
    border: 1px solid #000000;
    color: #000000;
  }

  &.delete {
    background: #E42121;
    border: 1px solid #E42121;
    color: white;

    &:hover {
      opacity: 0.8;
    }

    &:active {
      background: #E42121;
    }
  }

  svg {
    width: 16px;
    height: 16px;
  }
`

export const DeleteConfirmationModal = ({ onConfirm, onCancel }) => {
  return (
    <ModalOverlay onClick={onCancel}>
      <ModalContent onClick={e => e.stopPropagation()}> 
        <Title>
          <div className="modal-close-icon" onClick={onCancel} role='button'>
            <Icons.CancelPopup className="icon" iconColor='#9C9C9C' />
          </div>
          <div className="modal-title">
           <Icons.WarningSolid className="icon" iconColor='#E42121' css={{
              position: 'relative',
              top: '-1px',
            }} />
            Delete Chart
          </div>
        </Title>
        <div className='modal-content'>
          <Message>
            This action will delete the chart and cannot be undone. Are you sure you want to proceed?
          </Message>
        </div>
        <ButtonGroup>
          <Button className="cancel" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="delete" onClick={onConfirm}>
            Delete
          </Button>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  )
} 