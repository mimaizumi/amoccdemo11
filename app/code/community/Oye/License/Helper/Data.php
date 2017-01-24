<?php

class Oye_License_Helper_Data extends Mage_Core_Helper_Abstract
{
    const CACHE_KEY_COMPONENT = 'oyelicence_components_%s';
    const CACHE_KEY_ERROR     = 'oyelicence_error_%s';

    /**
     * 
     * @var JsonRPC_Client
     */
    private $_client;

    /**
     * 
     * @return array
     */
    public function getComponents()
    {
        $cacheKey             = sprintf(self::CACHE_KEY_COMPONENT, $this->getDomain());
        $componentsSerialized = Mage::app()->getCache()->load($cacheKey);

        if (false === $componentsSerialized)
        {
            $components   = array();
            $errorMessage = false;

            try 
            {
               /*    
                $response = $this->getClient()->auth(array(
                    'key' => $this->genKey($this->getDomain()), 
                    ));
                */
 
                //$components = $response['components'];
                $components = array("THEMER-MG-DESIGN", "OYE-MENU");
            }
            catch (Exception $e)
            {
                Mage::logException($e);

                $errorMessage = $e->getMessage();
            }

            Mage::app()->getCache()->save(serialize($components), $cacheKey);
            if ($errorMessage)
            {
                Mage::app()->getCache()->save($errorMessage, sprintf(self::CACHE_KEY_ERROR, $this->getDomain()));
            }
            else
            {
                Mage::app()->getCache()->remove(sprintf(self::CACHE_KEY_ERROR, $this->getDomain()));
            }

            return $components;
        }

        return unserialize($componentsSerialized);
    }

    public function genKey($domain)
    {

        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        $lookup   = null;
        $buffer   = $this->toUtf8($domain);
        $position = -1;
        $len      = count($buffer);
        $nan1     = null; 
        $nan2     = null; 
        $enc      = array(false, false, false, false);
        $result   = '';

        while (++$position < $len) 
        {
            $nan1   = isset($buffer[$position + 1]) ? $buffer[$position + 1] : null;
            $nan2   = isset($buffer[$position + 2]) ? $buffer[$position + 2] : null;
            $enc[0] = $buffer[$position] >> 2;
            $enc[1] = (($buffer[$position] & 3) << 4) | (@$buffer[++$position] >> 4);
            if (!is_numeric($nan1))
            {
                $enc[2] = $enc[3] = 64;
            }
            else 
            {
                $enc[2] = (($buffer[$position] & 15) << 2) | (@$buffer[++$position] >> 6);
                $enc[3] = (!is_numeric($nan2)) ? 64 : $buffer[$position] & 63;
            }

            $result .= $alphabet[$enc[0]].$alphabet[$enc[1]].$alphabet[$enc[2]].$alphabet[$enc[3]];
        }

        return $result;
    }

    public function toUtf8($string) 
    {
        $position = -1;
        $len      = strlen($string);
        $chr      = null;
        $buffer   = array();

        if (preg_match('/^[\x00-\x7f]*$/U', $string))
        {
            while (++$position < $len)
            {
                $buffer[] = ord(substr($string, $position, 1));
            }
        }
        else 
        {
            while (++$position < $len) 
            {
                $chr = ord(substr($string, $position, 1));
                if ($chr < 128)
                {
                    $buffer[] = $chr;
                }
                elseif (chr < 2048) 
                {
                    $buffer[] = (chr >> 6) | 192;
                    $buffer[] = (chr & 63) | 128;
                }
                else
                {
                    $buffer[] = (chr >> 12) | 224;
                    $buffer[] = ((chr >> 6) & 63) | 128;
                    $buffer[] = (chr & 63) | 128;
                }
            }
        }

        return $buffer;
    }

    /**
     * @return JsonRPC_Client
     */
    public function getClient()
    {
        if (is_null($this->_client))
        {
            try 
            {
                $this->_client = new JsonRPC_Client(Mage::getStoreConfig('oyelicense/server/url'), Mage::getStoreConfig('oyelicense/server/debug'));
            }
            catch (Exception $e)
            {
                Mage::logException($e);
            }
        }

        return $this->_client;
    }

    public function getDomain()
    {
        $domain = !empty($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : '';

        if (!$domain)
        {
            $domain = !empty($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
        }

        if (0 === strpos($domain, 'www.'))
        {
            $domain = substr($domain, 4);
        }

        return $domain;
    }

    public function getCacheKey()
    {
        return sprintf(self::CACHE_KEY, $this->getDomain());
    }
}
