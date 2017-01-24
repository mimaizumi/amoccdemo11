<?php
class Oye_Themetuner_Adminhtml_ThemetunerController extends Mage_Adminhtml_Controller_Action
{
	protected function _initAction()
	{
		$this->loadLayout()->_setActiveMenu('cms');
		return $this;
	}

    public function indexAction() {
        $this->_title($this->__('CMS'))->_title($this->__('Theme Editor'));
        
        $this->loadLayout();
        $this->_setActiveMenu('themetuner');
        $this->renderLayout();
	}
	
	public function editAction() {
		$this->_title($this->__('CMS'))->_title($this->__('Theme Editor'));
		
		$presetId = Mage::app()->getRequest()->getParam('id', 0);
		
		if ($presetId > 0) {
			$this->_title('Edit Store');
			$preset = Mage::getModel('themetuner/preset')->load($presetId);
			$storeId = $preset->getStoreId();
			$theme = $preset->getTheme();
			$name = $preset->getName();
            $logo = $preset->getLogo();
			
		} else {
			$this->_title('New Store');
			$theme = Mage::app()->getRequest()->getParam('theme', '');
			$name = '';
			$logo = '';
			
			// get default store id for attached content
            $websitesCollection = Mage::getModel('core/website')->getCollection();
            $websitesCollection->getSelect()->order('sort_order '.Varien_Db_Select::SQL_ASC);
            $websitesCollection->getSelect()->limit(1);
            
			foreach ($websitesCollection as $website) {
			    $storeId = $website->getDefaultStore()->getStoreId();
			}
		}
		
		$this->_initAction();
		$this->getLayout()->getBlock('head')->setCanLoadExtJs(true);
		
		$this->_addContent(
            $this->getLayout()->createBlock('themetuner/adminhtml_edit')
                ->setPresetId($presetId)
                ->setLogo($logo)
                ->setStoreId($storeId)
                ->setTheme($theme)
                ->setName($name)
        );
        
        $this->renderLayout();
	}
	
	public function deleteAction() {
		try {
			$id = Mage::app()->getRequest()->getParam('id');
			
            $preset = Mage::getModel('themetuner/preset')->load($id);
            $presetName = $preset->getName();
            $preset->delete();
            
            Mage::getSingleton('adminhtml/session')->addSuccess(
                Mage::helper('themetuner')->__('Tune "%s" has been deleted.', $presetName)
            );
            
		} catch (Exception $e) {
			Mage::logException($e);
		}
		$this->_redirect('*/*/');
	}
	
	public function gridAction() {
		$this->getResponse()->setBody(
            $this->getLayout()->createBlock('themetuner/adminhtml_preset_grid')->toHtml()
        );
	}
	
	public function saveAction() {
	    
		try {
		    $data = Mage::app()->getRequest()->getPost();
		    $data['errors'] = array();
		    
    		$presetId = !empty($data['presetId']) ? $data['presetId'] : null;
    		$presetName = !empty($data['presetName']) ? trim($data['presetName']) : '';
    		
    		if (!$presetId && !$presetName) {
    		    $data['errors']['name_missing'] = Mage::helper('themetuner')->__('Please enter name for "Style".');
    		}
    		
    		// check for duplicate preset name
    		if ($presetName) {
                $existingPresets = Mage::getModel('themetuner/preset')->getCollection()->addNameFilter($presetName);
                if (count($existingPresets)) {
                    $data['errors']['name_duplicate'] = Mage::helper('themetuner')->__('"Style" with this name already exists. Please choose another one.');
                }
    		}
    		
		    if (!count($data['errors'])) {
        		list($serializedCss, $layoutXml) = $this->_preparePresetUpdates($data['data']);
        		$storeId = $data['store_id'];
        		$logo = !empty($data['logo']) ? trim($data['logo']) : '';
    		
                $preset = !$presetId
                    ? new Oye_Themetuner_Model_Preset()
                    : Mage::getModel('themetuner/preset')->load($presetId);
                    
                if (!empty($data['theme'])) {
                    list(
                        $packageDir,
                        $localeDir,
                        $templateDir,
                        $skinDir,
                        $layoutDir,
                        $defaultDir
                    ) = explode('|', $data['theme']);
                    
                    foreach (array('package', 'locale', 'template', 'skin', 'layout', 'default') as $dir) {
                        $preset->setData('theme_'.$dir.'_dir', ${$dir.'Dir'});
                    }
                }
    	    	
    	    	if (!$presetId) {
                    $preset->setName($presetName);
    	    	}

    	    	$preset->setStoreId($storeId);
    	    	$preset->setCss($serializedCss);
    	    	$preset->setLayoutUpdates($preset->mergeLayoutUpdates($preset->getLayoutUpdates(), $layoutXml));
    	    	$preset->setLogo($logo);
                $preset->setUpdatedAt(date('Y-m-d H:i:s'));
    	    	$preset->save();
    	    	
    	    	$data['presetId'] = $preset->getId();
    	    	$data['redirect_url'] = Mage::helper("adminhtml")->getUrl('*/*/edit', array('id'=> $data['presetId']));
		    }
		    
		    $this->getResponse()->setHeader('Content-type', 'application/json');
            $this->getResponse()->setBody(json_encode($data));
            
        } catch (Exception $e) {
            Mage::logException($e);
		}
	}
	
	public function savePresetSelectionAction() {
        echo $this->getLayout()->createBlock('core/template', '', array(
            'template' => 'themetuner/save_popup.phtml')
        )->toHtml();
    }
	/* Test */
	public function activateAction() {
		echo $this->getLayout()->createBlock('themetuner/adminhtml_activate', '', array(
				'template' => 'themetuner/activate_popup.phtml')
		)->toHtml();
	}

	public function saveActivateAction() {
		//print_r('here1');
		Mage::log('save Activate Action');
		//die();
		try {
			$helper = Mage::helper('themetuner');

			$data = Mage::app()->getRequest()->getPost();
			$data['errors'] = array();

			if (empty($data['id'])) {
				$data['errors']['id_missing'] = $helper->__("Can't load style. Save failed.");

			} /*else if (empty($data['store_id'])) {
				$data['errors']['store_id_missing'] = $helper->__("Can't find store. Save failed.");

			} */ else {

				// check theme variables, trim values
				$hasEmptyValues = false;
				/*
				foreach (array('package', 'locale', 'template', 'skin', 'layout', 'default') as $dir) {
					$$dir = !empty($data[$dir]) ? trim($data[$dir]) : '';
					if (!$$dir) {
						$hasEmptyValues = true;
					}
				}
				*/
				if ($hasEmptyValues) {
					$data['errors']['empty_values'] = $helper->__('All inputs must be filled. Try again.');
				}
			}
			$scope = explode(",", $data['scope']);
			$scope_type = $scope[0];
			$scope_id = $scope[1];
			Mage::log($data);
			Mage::log($scope);
			//Mage::log($preset->getData('theme_package_dir'));
			Mage::log('theme: ');
			//$helper = Mage::helper('themetuner');



			/*
			Mage::log($helper->__('Package Name:'));
			Mage::log($preset->getData('theme_package_dir'));

			Mage::log($helper->__('Package Name:'));
			Mage::log($preset->getData('theme_package_dir'));
			*/
			//Mage::log($preset->getData('theme_package_dir'));
			//$preset = $this->getPreset();
			//$preset = Mage::helper('module/data')->getPreset();
			//Mage::log($preset);
			//Mage::log($preset->getData('theme_package_dir'));

			if (!count($data['errors'])) {
				$presets = Mage::getModel('themetuner/preset')->load($data['id']);
				//Package Name

				$package = (string)$presets->getData('theme_package_dir');
				//Theme
				$locale = (string)$presets->getData('theme_locale_dir');
				//Templates
				$template = (string)$presets->getData('theme_template_dir');
				//Skin
				$skin = (string)$presets->getData('theme_skin_dir');
				//Layout
				$layout = (string)$presets->getData('theme_layout_dir');
				//Default
				$default = (string)$presets->getData('theme_default_dir');

				$params = Mage::app()->getRequest()->getParams();

				if (isset($params['store'])) {
					$pathPrefix = "stores/{$params['store']}/";
				} else if (isset($params['website'])) {
					$pathPrefix = "websites/{$params['website']}/";
				} else { // default scope
					$pathPrefix = 'default/';
				}
				/*
				$package = (string)Mage::getConfig()->getNode($pathPrefix.'design/package/name');
				$locale = (string)Mage::getConfig()->getNode($pathPrefix.'design/theme/locale');
				$template = (string)Mage::getConfig()->getNode($pathPrefix.'design/theme/template');
				$skin = (string)Mage::getConfig()->getNode($pathPrefix.'design/theme/skin');
				$layout = (string)Mage::getConfig()->getNode($pathPrefix.'design/theme/layout');
				$default = (string)Mage::getConfig()->getNode($pathPrefix.'design/theme/default');
				*/
				$presets = Mage::helper('themetuner')->getPresets($package, $locale, $template, $skin, $layout, $default);

				Mage::log('presets: ');
				Mage::log($presets);

				$sep = '|';

				$dir_string = $package . $sep . $locale . $sep . $template . $sep . $skin . $sep . $layout . $sep . $default;


				if ($scope_type == 'default') {
					$save = new Mage_Core_Model_Config();
					$save->saveConfig('design/package/name', $package, $scope_type, $scope_id);
					$save->saveConfig('design/theme/theme_shortcut', $dir_string, $scope_type, $scope_id);
					$save->saveConfig('design/theme/locale', $locale, $scope_type, $scope_id);
					$save->saveConfig('design/theme/template', $template, $scope_type, $scope_id);
					$save->saveConfig('design/theme/skin', $skin, $scope_type, $scope_id);
					$save->saveConfig('design/theme/layout', $layout, $scope_type, $scope_id);
					$save->saveConfig('design/theme/default', $default, $scope_type, $scope_id);

					//Save our style
					$save->saveConfig('design/theme/themetuner_preset', $data['id'], $scope_type, $scope_id);
				} else if ($scope_type == 'websites') {
					$save = new Mage_Core_Model_Config();
					$save->saveConfig('design/package/name', $package, $scope_type, $scope_id);
					$save->saveConfig('design/theme/theme_shortcut', $dir_string, $scope_type, $scope_id);
					$save->saveConfig('design/theme/locale', $locale, $scope_type, $scope_id);
					$save->saveConfig('design/theme/template', $template, $scope_type, $scope_id);
					$save->saveConfig('design/theme/skin', $skin, $scope_type, $scope_id);
					$save->saveConfig('design/theme/layout', $layout, $scope_type, $scope_id);
					$save->saveConfig('design/theme/default', $default, $scope_type, $scope_id);

					//Save our style
					$save->saveConfig('design/theme/themetuner_preset', $data['id'], $scope_type, $scope_id);
				} else {
					$save = new Mage_Core_Model_Config();
					$save->saveConfig('design/package/name', $package, $scope_type, $scope_id);
					$save->saveConfig('design/theme/theme_shortcut', $dir_string, $scope_type, $scope_id);
					$save->saveConfig('design/theme/locale', $locale, $scope_type, $scope_id);
					$save->saveConfig('design/theme/template', $template, $scope_type, $scope_id);
					$save->saveConfig('design/theme/skin', $skin, $scope_type, $scope_id);
					$save->saveConfig('design/theme/layout', $layout, $scope_type, $scope_id);
					$save->saveConfig('design/theme/default', $default, $scope_type, $scope_id);

					//Save our style
					$save->saveConfig('design/theme/themetuner_preset', $data['id'], $scope_type, $scope_id);
				}

				/*
				$preset = $this->getPreset();
				//$preset = Mage::helper('module/data')->getPreset();
				Mage::log($preset);
				Mage::log($preset->getData('theme_package_dir'));

				$preset->setData('theme_'.$dir.'_dir', $$dir);
				$preset->setStoreId($data['store_id']);
				$preset->save();
				*/

				//print_r('here end!');
				//die();
			}
			Mage::app()->getCacheInstance()->cleanType('config');

			$this->getResponse()->setHeader('Content-type', 'application/json');
			$this->getResponse()->setBody(json_encode($data));

		} catch (Exception $e) {
			Mage::logException($e);
		}
	}

    public function settingsAction() {
        echo $this->getLayout()->createBlock('themetuner/adminhtml_settings', '', array(
            'template' => 'themetuner/settings_popup.phtml')
        )->toHtml();
    }


    public function saveSettingsAction() {
        try {
		    $helper = Mage::helper('themetuner');

		    $data = Mage::app()->getRequest()->getPost();
		    $data['errors'] = array();
		    
		    if (empty($data['id'])) {
		        $data['errors']['id_missing'] = $helper->__("Can't load style. Save failed.");
		        
		    } else if (empty($data['store_id'])) {
		        $data['errors']['store_id_missing'] = $helper->__("Can't find store. Save failed.");
		        
		    } else {
		        
		        // check theme variables, trim values
		        $hasEmptyValues = false;
		        foreach (array('package', 'locale', 'template', 'skin', 'layout', 'default') as $dir) {
		            $$dir = !empty($data[$dir]) ? trim($data[$dir]) : '';
		            if (!$$dir) {
		                $hasEmptyValues = true;
		            }
		        }
		        
		        if ($hasEmptyValues) {
		            $data['errors']['empty_values'] = $helper->__('All inputs must be filled. Try again.');
		        }
		    }
		    
            if (!count($data['errors'])) {
                $preset = Mage::getModel('themetuner/preset')->load($data['id']);
                foreach (array('package', 'locale', 'template', 'skin', 'layout', 'default') as $dir) {
                    $preset->setData('theme_'.$dir.'_dir', $$dir);
                }
                $preset->setStoreId($data['store_id']);
                $preset->save();
            
            }
		    
		    $this->getResponse()->setHeader('Content-type', 'application/json');
            $this->getResponse()->setBody(json_encode($data));
            
        } catch (Exception $e) {
            Mage::logException($e);
		}
    }
    
    public function presetOptionsAction() {
        
        $package = $this->getRequest()->getParam('package', '');
        $locale = $this->getRequest()->getParam('locale', '');
        $template = $this->getRequest()->getParam('template', '');
        $skin = $this->getRequest()->getParam('skin', '');
        $layout = $this->getRequest()->getParam('layout', '');
        $default = $this->getRequest()->getParam('default', '');
        
        $presets = Mage::helper('themetuner')->getPresets($package, $locale, $template, $skin, $layout, $default);
        
        $this->getResponse()->setHeader('Content-type', 'application/json');
        $this->getResponse()->setBody(json_encode($presets));
	}

	protected function _preparePresetUpdates($serializedRequest)
	{
	    $request = Zend_Json::decode($serializedRequest);
	    $css     = array();
	    $layout  = array();
	    $layoutXml = '';

	    foreach ($request as $item)
	    {
	        if (isset($item['type']) && 'layout' == $item['type'])
	        {
	            $itemIds     = explode('::', $item['id']);
	            $itemId      = end($itemIds);
	            $oldParentId = $itemIds[0];
	            $itemHandle  = isset($item['handle']) ? $item['handle'] : 'default';
	            $itemXml     = isset($layout[$itemHandle][$itemId]) ? $layout[$itemHandle][$itemId] : array();

	            if (empty($item['alias']))
	            {
	                $item['alias'] = $itemId;
	            }

	            switch ($item['action'])
	            {
	                case 'remove':
	                    $itemXml['unsetChild'][] = '<reference name="'.$oldParentId.'">'.
                            '<action method="unsetChild"><alias>'.$item['alias'].'</alias></action>'.
                        '</reference>';
	                    break;

	                case 'add':
	                    $itemXml['insert'][] = '<reference name="'.$item['parent'].'" >'.
                            '<action method="insert"><blockName>'.$itemId.'</blockName><siblingName>'.$item['after'].'</siblingName><after>'.($item['after'] ? 1 : 0).'</after></action>'.
                        '</reference>';
	                    break;

	                case 'widget':
	                    $widgetParams = array();
	                    parse_str($item['params'], $widgetParams);
                        $widgetBlock = simplexml_load_string('<block />');
                        if (!isset($widgetParams['parameters']))
                        {
                            $widgetParams['parameters'] = array();
                        }
                        else
                        {
    	                    foreach ($widgetParams['parameters'] as $param => & $value)
    	                    {
    	                        $action = 'set'.str_replace(' ', '', ucwords(str_replace('_', ' ', $param)));
    	                        $widgetAction = $widgetBlock->addChild('action');
    	                        $widgetAction->addAttribute('method', $action);
    	                        $widgetAction->addChild('value', $value);
    	                        $value = $widgetAction->asXML();
    	                    }
                        }

	                    $itemXml['widget'][] = '<reference name="'.$item['parent'].'" >'.
       	                    '<block type="'.$widgetParams['widget_type'].'" name="'.$itemId.'">'.join('', $widgetParams['parameters']).'</block>'.
                        '</reference>';
	                    break;

                    case 'update':
                        $itemXml['unsetChild'][] = '<reference name="'.$oldParentId.'">'.
                                '<action method="unsetChild"><alias>'.$item['alias'].'</alias></action>'.
                            '</reference>';
                        $itemXml['insert'][] = '<reference name="'.$item['parent'].'" >'.
                                '<action method="insert"><blockName>'.$itemId.'</blockName><siblingName>'.$item['after'].'</siblingName><after>'.($item['after'] ? 1 : 0).'</after></action>'.
                            '</reference>';
                        break;

                    case 'columns':
                        $itemXml['columns'][$itemId] = $itemId ? '<update handle="'.$itemId.'" />' : '';
                        $itemId = '@columns';
                        break;
	            }

	            $layout[$itemHandle][$itemId] = $itemXml;
	        }
	        else
	        {
	            $css[] = $item;
	        }
	    }

	    return array(Zend_Json::encode($css), $layout);
	}

	public function ajaxCacheLayoutAction()
	{
	    $editorId = $this->getRequest()->getParam('id');
	    $data     = $this->getRequest()->getParam('data');

	    if (!$editorId || !$data)
	    {
	        return false;
	    }

        list($serializedCss, $layoutXml) = $this->_preparePresetUpdates($data);

	    if ($layoutXml)
	    {
	        Mage::app()->getCache()->save(serialize($layoutXml), 'themetuner_mage_'.$editorId, array('themetuner', 'mage'));
	    }

	    $this->getResponse()->setBody(1);
	}

	public function ajaxNewBlockAction()
	{
	    $columnId = $this->getRequest()->getParam('column');

        Mage::register('themetuner_in_admin', 1);
        Mage::register('themetuner_editor_id', $this->getRequest()->getParam('themetuner_editor_id'));
        Mage::register('themetuner_preset_id', $this->getRequest()->getParam('themetuner_preset_id'));
        Mage::register('themetuner_column', $columnId);

	    $this->loadLayout()->renderLayout();
	}

    /**
     * Ajax responder for loading plugin options form
     */
    public function loadOptionsAction()
    {
        try {
            $this->loadLayout('empty');
            if ($paramsJson = $this->getRequest()->getParam('widget')) {
                $request = Mage::helper('core')->jsonDecode($paramsJson);
                if (is_array($request)) {
                    $optionsBlock = $this->getLayout()->getBlock('wysiwyg_widget.options');
                    if (isset($request['widget_type'])) {
                        $optionsBlock->setWidgetType($request['widget_type']);
                    }
                    if (isset($request['values'])) {
                        $optionsBlock->setWidgetValues($request['values']);
                    }
                }
                $this->renderLayout();
            }
        } catch (Mage_Core_Exception $e) {
            $result = array('error' => true, 'message' => $e->getMessage());
            $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($result));
        }
    }
}
