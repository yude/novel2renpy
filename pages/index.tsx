import Head from 'next/head'
import * as React from "react"
import { useState } from "react"
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Modal from 'react-bootstrap/Modal';
import styles from '../styles/Home.module.css'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboard, faInfo, faWrench, faSignature, faNoteSticky, faHeart } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons"
import CodeMirror from '@uiw/react-codemirror';
import { langs } from '@uiw/codemirror-extensions-langs';

export default function Home() {
  let [value, setValue] = useState('');
  let [splitter, setSplitter] = useState('');
  let [temp, setTemp] = useState('aaaa');

  let [character, setCharacter] = useState([{ name: "ナレーション", renpy: "narrator" }])

  const [charaModal, setCharaModal] = useState(false);
  const handleCloseCharacterModal = () => setCharaModal(false);
  const handleShowCharacterModal = () => setCharaModal(true);

  const [commentModal, setCommentModal] = useState(false);
  const handleCloseCommentModal = () => setCommentModal(false);
  const handleShowCommentModal = () => setCommentModal(true);

  // define raw lines
  let lines: string[] = []

  // define parsed lines
  let parent_lines: string[] = []
  let parsed_lines_chara: string[] = []
  let parsed_lines_dialogue: string[] = []

  function updateCharacterRenPy(name: string, new_renpy: string) {
    const newCharacterState = character.map(obj => {
      if (obj.name === name) {
        return { ...obj, renpy: new_renpy }
      }
      return obj
    })

    setCharacter(newCharacterState)
  }

  React.useEffect(() => {
    let source: string = value
    let render_lines: string = ""
    source = source.replace(/\t/d, '')
    source = source.replace(/\u3000/g, '')
    source = source.replace(/	/g, '')
    lines = source.split('\n')

    // reset variables
    parsed_lines_chara = []
    parsed_lines_dialogue = []

    // parse lines
    const blocks = source.split('\n\n')
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i].split('\n')
      let block_chara_source: string = ""
      let block_chara: string[] = []
      let block_dialogue: string[] = []

      for (let j = 0; j < block.length; j++) {
        if (block[j] !== "") {
          const splitters = splitter.split('')
          let isComment: boolean = false
          if (block[j] !== "") {

            // check whether if this line is comment
            for (let k = 0; k < splitters.length; k++) {
              if (block[j].includes(splitters[k])) {
                isComment = true
                break
              }
            }

            if (isComment) { // if this line in block is comment
              block_chara.push("comment")
              block_dialogue.push(block[j])
            } else {
              if (block[j].includes("「")) { // if this line in block is dialogue
                const pos_dialogue: number = block[j].indexOf('「')
                block_chara.push(block[j].slice(0, pos_dialogue))
                block_dialogue.push(block[j].slice(pos_dialogue))
              } else {
                block_chara.push("ナレーション")
                block_dialogue.push(block[j])
              }
            }

          }
        }

        // retrieve this block's character source
        for (let j = 0; j < block.length; j++) {
          if (block_chara[j] !== "") {
            block_chara_source = block_chara[j]
            break
          }
        }

        // set unknown character to predictable character
        for (let j = 0; j < block.length; j++) {
          if (block_chara[j] === "") {
            block_chara[j] = block_chara_source
            break
          }
        }
      }

      for (let j = 0; j < block_chara.length; j++) {
        parsed_lines_chara.push(block_chara[j])
        parsed_lines_dialogue.push(block_dialogue[j])
      }
    }

    let character_list = Array.from(new Set(parsed_lines_chara))
    character_list = character_list.filter(function (e) { return e !== 'ナレーション' })
    character_list = character_list.filter(function (e) { return e !== '' })

    if (value !== "") {
      const index = character.indexOf(character.filter(obj => obj.name == "ナレーション")[0])
      render_lines += "# キャラクターを定義\n"

      render_lines += "define " + character[index].renpy + " = Character('')\n"
    }
    for (let i = 0; i < character_list.length; i++) {
      const index = character.findIndex((item) => item.name === character_list[i])
      if (index == -1) {
        if (character_list[i] !== "comment") {
          render_lines += "define " + character_list[i] + " = Character('" + character_list[i] + "')\n"

          setCharacter(
            (p) => ([
              ...p,
              {
                name: character_list[i],
                renpy: "",
                index: character.indexOf(character.filter(obj => obj.name == character_list[i])[0])
              }
            ])
          )
        }
      } else {
        if (character_list[i] !== "comment") {
          if (character[index].renpy == "") {
            render_lines += "define " + character[index].name + " = Character('" + character_list[i] + "')\n"
          } else {
            render_lines += "define " + character[index].renpy + " = Character('" + character_list[i] + "')\n"
          }
        }
      }
    }

    if (value !== "") {
      render_lines += "\n# ストーリーの記述\n"
    }

    // render lines
    for (let i = 0; i < parsed_lines_chara.length; i++) {
      if (parsed_lines_chara[i] === "comment") {
        render_lines += "# " + parsed_lines_dialogue[i] + "\n"
      } else {
        // retrieve character name
        if (parsed_lines_chara[i] === "") {
          const filtered = character.filter(obj => {
            return obj.name === "ナレーション"
          })
          if (filtered[0].renpy === "") {
            render_lines += filtered[0].name
          } else {
            render_lines += filtered[0].renpy
          }
        } else {
          const filtered = character.filter(obj => obj.name == parsed_lines_chara[i])
          if (filtered[0]) {
            if (filtered[0].renpy === "") {
              render_lines += filtered[0].name
            } else {
              render_lines += filtered[0].renpy
            }
          }
        }

        // retrieve dialogue
        render_lines += " \""
        render_lines += parsed_lines_dialogue[i]
        render_lines += "\""
        render_lines += "\n"
      }
    }
    setTemp(render_lines)
  }, [value, character, splitter])

  return (
    <div className={styles.container}>
      <Head>
        <title>novel2renpy</title>
        <meta name="description" content="novel2renpy: ノベルゲームの原稿を Ren'Py のソースコードに変換します。" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h3 className="mt-5">novel2renpy</h3>
        <h6>ノベルゲームの原稿を Ren'Py のソースコードに変換します。</h6>
        <div className="container mt-2">
          <Card style={{ width: "100%" }}>
            <Card.Body>
              <Card.Title><FontAwesomeIcon icon={faWrench} width={18} height={18} transform="up-1" /> 設定</Card.Title>
              <Card.Text>
                <Button variant="primary" onClick={handleShowCharacterModal} className="m-2">
                  <FontAwesomeIcon icon={faSignature} width={18} height={18} transform="up-1" /> キャラクター名
                </Button>
                <Button variant="primary" onClick={handleShowCommentModal} className="m-2">
                  <FontAwesomeIcon icon={faNoteSticky} width={18} height={18} transform="up-1" /> コメント行
                </Button>
              </Card.Text>
            </Card.Body>
          </Card>

          <div className="d-lg-none">
            <Tabs
              defaultActiveKey="source"
              id="input-tabs"
              className="mt-2"
            >
              <Tab eventKey="source" title="変換元">
                <CodeMirror
                  placeholder="ここに原稿を入力 または ペースト..."
                  height="35rem"
                  autoFocus={true}
                  value={value}
                  extensions={[langs.python()]}
                  onChange={(value) => { setValue(value) }}
                />
              </Tab>
              <Tab eventKey="converted" title="変換後">
                <CodeMirror
                  placeholder="ここに変換済みのソースコードが表示されます。"
                  height="35rem"
                  value={temp}
                  readOnly={true}
                  extensions={[langs.python()]}
                />
              </Tab>
            </Tabs>
          </div>
          <div className="d-none d-lg-block">
            <div className="row mt-2">
              <div className="col-6">
                <CodeMirror
                  placeholder="ここに原稿を入力 または ペースト..."
                  height="35rem"
                  autoFocus={true}
                  value={value}
                  extensions={[langs.python()]}
                  onChange={(value) => setValue(value)}
                />
              </div>
              <div className="col-6">
                <CodeMirror
                  placeholder="ここに変換済みのソースコードが表示されます。"
                  height="35rem"
                  value={temp}
                  readOnly={true}
                  extensions={[langs.python()]}
                />
                <Button variant="primary" className="mt-2" onClick={() => { navigator.clipboard.writeText(temp) }}><FontAwesomeIcon icon={faClipboard} width={20} height={20} /> コピーする</Button>
              </div>
            </div>
          </div>
        </div>
        <div className="container mt-4">
          <Modal show={charaModal} onHide={handleCloseCharacterModal}>
            <Modal.Header closeButton>
              <Modal.Title><FontAwesomeIcon icon={faSignature} width={25} height={25} transform="up-1" /> Ren'Py 内のキャラクター定義の設定</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>キャラクター名</th>
                    <th>Ren'Py コード内での定義</th>
                  </tr>
                </thead>
                <tbody>
                  {character.map((obj, index) => {
                    return (
                      <tr key={index}>
                        <td>{obj.name}</td>
                        <td><Form.Control placeholder={obj.name} onChange={(event) => updateCharacterRenPy(obj.name, event.target.value)} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </Modal.Body>
          </Modal>

          <Modal show={commentModal} onHide={handleCloseCommentModal}>
            <Modal.Header closeButton>
              <Modal.Title><FontAwesomeIcon icon={faNoteSticky} width={25} height={25} transform="up-1" /> コメントとして解釈する行の設定</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Text className="text-muted">
                &nbsp;次の文字 (記号) が含まれている行は、コメントとして解釈します。
              </Form.Text>
              <Form.Control onChange={(event) => setSplitter(event.target.value)} placeholder="連続して入力することで、複数個指定できます。(例: *＊#)" />
            </Modal.Body>
          </Modal>


          <hr />
          <p><FontAwesomeIcon icon={faInfo} width={20} height={20} transform="up-3" /> 入力した内容はすべてブラウザ内で処理され、外部のサーバー等に送信されることはありません。</p>
          <p>&copy; 2022 yude &lt;i[at]yude.jp&gt;. / <FontAwesomeIcon icon={faHeart} width={18} height={18} transform="up-1" /> <a href="https://github.com/yude/novel2renpy/blob/master/LICENSE">MIT License</a>. / <FontAwesomeIcon icon={faGithub} width={18} height={18} transform="up-1" /> GitHub: <a href="https://github.com/yude/novel2renpy">yude/novel2renpy</a></p>
        </div>
      </main>
    </div >
  )
}
