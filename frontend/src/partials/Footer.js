import{Link} from 'react-router-dom';

function Footer() {
  const user = JSON.parse(localStorage.getItem("user"));
  return (
    <>
    <div className="app-footer">
						
<span className='fw-semibold'>{user.role}</span>
</div>
					
    </>
  );
}

export default Footer;
